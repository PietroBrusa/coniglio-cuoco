/**
 * Il ritmo della modalità difficile: finestre che si accendono e si spengono, e
 * assegnazione del punto.
 *
 * Sta fuori dalla schermata di gioco perché riguarda **solo il gioco**: la
 * modalità difficile non raccoglie dati (vedi
 * {@link domain/sessionRecord.collectsData}), quindi niente di ciò che accade
 * qui finisce in una misurazione. Tenendolo separato, la schermata di gioco
 * resta il posto dove si conduce il livello e si misura, e la meccanica a tempo
 * non si mescola con la registrazione dei contatti.
 *
 * Le regole che decidono se un tentativo vale un punto sono a loro volta isolate
 * in {@link domain/hardBeat}, che è codice puro e verificabile senza timer.
 *
 * @module
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { sampleBeatMs, isHeldThrough } from '@/domain/hardBeat';
import { useMakeyKey } from './useMakeyKey';
import type { HardBeat } from '@/types';

/** Attesa prima della prima finestra utile, per non cogliere di sorpresa il bambino. */
const FIRST_BEAT_MS = 800;

/** Durata del lampeggio rosso che segnala un errore: breve, segnala senza punire. */
const MISS_FLASH_MS = 250;

/** Ciò che il ritmo espone alla schermata di gioco. */
export interface HardBeatState {
  /** `true` mentre la finestra utile è accesa: illumina l'alimento. */
  windowOpen: boolean;
  /** Finestre centrate finora, per la barra di avanzamento. */
  scored: number;
  /** `true` durante il lampeggio che segnala un errore. */
  miss: boolean;
  /**
   * Legge le finestre centrate senza passare da un render.
   *
   * La usa il timer di fine livello, che legge una volta sola allo scadere del
   * tempo: se dipendesse dallo stato, ogni punto ne farebbe ripartire il conto
   * alla rovescia.
   */
  getScored: () => number;
}

/**
 * Conduce il ciclo delle finestre utili e conta quelle centrate.
 *
 * Il ciclo è: attesa iniziale, finestra accesa per una durata estratta in
 * `beat.onMs`, pausa estratta in `beat.offMs`, di nuovo accesa, e così via. Con
 * estremi uguali il ritmo è fisso e prevedibile; con estremi diversi cambia a
 * ogni battuta, così non si può anticipare a memoria e bisogna guardare
 * l'alimento.
 *
 * Il punto si assegna in due modi, secondo `beat.score`:
 *
 * - `tap`: basta toccare mentre la finestra è accesa, e il punto scatta subito;
 * - `hold`: bisogna mantenere il contatto fino alla chiusura, quindi la verifica
 *   avviene **alla chiusura** della finestra — prima non si può sapere se il
 *   contatto è stato mantenuto.
 *
 * @param beat - Parametri del ritmo del livello in corso.
 * @param active - `true` durante la fase di gioco in modalità difficile.
 * @returns Stato della finestra corrente, punteggio e lampeggio di errore.
 */
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

  useEffect(() => {
    if (!active) return undefined;
    let timer: number;

    const closeWindow = () => {
      const openedAt = openedAtRef.current ?? 0;
      openedAtRef.current = null;
      setWindowOpen(false);

      if (beat.score === 'hold') {
        if (isHeldThrough(openedAt, pressStartRef.current)) scoreBeat();
        // Il contatto già in corso da prima dell'accensione non vale il punto:
        // senza questo lampeggio il bambino che tiene il dito appoggiato non
        // riceverebbe alcun riscontro, né positivo né negativo, per tutto il
        // livello. Chi invece non sta toccando non viene segnalato: aspettare la
        // finestra è il comportamento corretto, non un errore.
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
      if (!windowOpenRef.current) triggerMiss();
      else if (beat.score === 'tap') {
        scoreBeat();
        scoredInWindowRef.current = true;
      } else touchedRef.current = true;
    },
    onRelease: () => {
      if (pressStartRef.current === null) return;
      pressStartRef.current = null;
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
