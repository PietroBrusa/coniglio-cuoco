import { useCallback, useEffect, useRef, useState } from 'react';
import { sampleBeatMs, isHeldThrough } from '@/domain/hardBeat';
import { useMakeyKey } from './useMakeyKey';
import type { HardBeat } from '@/types';

//Tempo che passa prima della prima finestra
const FIRST_BEAT_MS = 800;

//Quanto rimane acceso il lampeggio rosso d'errore
const MISS_FLASH_MS = 250;


export interface HardBeatState {
  windowOpen: boolean;
  scored: number;
  miss: boolean;
  getScored: () => number;
}

//Ref per le misure, state per i disegni
export function useHardBeat(beat: HardBeat, active: boolean): HardBeatState {
  const [windowOpen, setWindowOpen] = useState(false);
  const [scored, setScored] = useState(0);
  const [miss, setMiss] = useState(false);

  const windowOpenRef = useRef(false);
  const missTimer = useRef<number | undefined>(undefined);
  const openedAtRef = useRef<number | null>(null);
  const pressStartRef = useRef<number | null>(null);
  const touchedRef = useRef(false);
  const scoredInWindowRef = useRef(false);
  const scoredRef = useRef(0);

  useEffect(() => {
    windowOpenRef.current = windowOpen;
  }, [windowOpen]);

  const triggerMiss = useCallback(() => {
    setMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(false), MISS_FLASH_MS);
  }, []);

  const scoreBeat = useCallback(() => {
    scoredRef.current += 1;
    setScored(scoredRef.current);
  }, []);

  //openWindow e closeWindow si richiamano a vicenda con setTimeout, creando il ciclo di finestre
  useEffect(() => {
    if (!active) return undefined;
    //timer viene riassegnato a ogni ciclo: il cleanup cancella sempre quello in attesa in quel momento
    let timer: number;

    const closeWindow = () => {
      const openedAt = openedAtRef.current ?? 0;
      openedAtRef.current = null;
      setWindowOpen(false);

      if (beat.score === 'hold') {
        if (isHeldThrough(openedAt, pressStartRef.current)) scoreBeat();
        else if (touchedRef.current || pressStartRef.current !== null) triggerMiss();
      } else if (!scoredInWindowRef.current && pressStartRef.current !== null) {
        triggerMiss();
      }
      touchedRef.current = false;
      scoredInWindowRef.current = false;

      timer = window.setTimeout(openWindow, sampleBeatMs(beat.offMs));
    };

    const openWindow = () => {
      openedAtRef.current = performance.now();
      touchedRef.current = false;
      scoredInWindowRef.current = false;
      setWindowOpen(true);
      timer = window.setTimeout(closeWindow, sampleBeatMs(beat.onMs));
    };

    timer = window.setTimeout(openWindow, FIRST_BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [active, beat, triggerMiss, scoreBeat]);

  useMakeyKey(active, {
    onPress: () => {
      if (pressStartRef.current !== null) return;
      pressStartRef.current = performance.now();
      //finestra chiusa -> errore, tocco arrivato al momento sbagliato
      if (!windowOpenRef.current) triggerMiss();
      //tap: segna subito il punto; hold: segna solo il contatto, il punto si decide alla chiusura
      else if (beat.score === 'tap') {
        scoreBeat();
        scoredInWindowRef.current = true;
      } else touchedRef.current = true;
    },

    onRelease: () => {
      if (pressStartRef.current === null) return;

      pressStartRef.current = null;
      //in hold, lasciare il dito mentre la finestra è ancora aperta è errore immediato
      if (beat.score === 'hold' && windowOpenRef.current && touchedRef.current) {
        touchedRef.current = false;
        triggerMiss();
      }
    },
  });

  useEffect(() => () => window.clearTimeout(missTimer.current), []);

  const getScored = useCallback(() => scoredRef.current, []);

  return { windowOpen, scored, miss, getScored };
}
