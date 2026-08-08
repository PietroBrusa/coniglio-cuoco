import { useCallback, useEffect, useRef, useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { useTouchTracker, MAKEY_KEYS } from '@/hooks/useTouchTracker';
import { sampleBeatMs, isHeldThrough } from '@/domain/hardBeat';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './LevelPlay.module.scss';

/**
 * Tocchi richiesti per passare dall'introduzione al gioco.
 *
 * Servono a tre cose: verificare che il circuito funzioni prima di iniziare a
 * misurare, dare al bambino un contatto non valutato che riduce la reattività al
 * compito, e far partire la misura quando il bambino è pronto invece che quando
 * l'operatore preme un pulsante — il che toglierebbe di mezzo una fonte di
 * variabilità.
 */
const STARTER_TAPS = 3;

/** Attesa prima della prima finestra utile, per non cogliere di sorpresa il bambino. */
const FIRST_BEAT_MS = 800;
/** Durata del lampeggio rosso che segnala un errore: breve, segnala senza punire. */
const MISS_FLASH_MS = 250;

/** Espressione del coniglio mentre il contatto è in corso, livello per livello. */
const ACTIVE_MOOD: Record<number, RabbitMood> = { 1: 'happy', 2: 'sniff', 3: 'eat' };

/** Che cosa serve alla schermata di gioco per condurre un livello. */
interface LevelPlayProps {
  /** Livello da eseguire. */
  level: Level;
  /** Alimento con cui si lavora. */
  food: Food;
  /** Condizione della sessione: cambia la meccanica del livello. */
  difficulty: Difficulty;
  /**
   * Richiamata allo scadere della finestra, con le misurazioni definitive e le
   * finestre centrate in modalità difficile (`null` in facile, dove il ritmo non
   * viene proposto).
   */
  onComplete: (result: Metrics, beatsScored: number | null) => void;
}

/**
 * Schermata di gioco: conduce un livello dall'introduzione alla fine della
 * misurazione.
 *
 * Si svolge in due fasi. Nell'**introduzione** viene raccontata la storia e si
 * attendono i tocchi di avvio; la misurazione è ferma. Nel **gioco** il
 * registratore dei contatti si attiva, ma la finestra di misura parte solo al
 * primo contatto: il tempo che il bambino impiega ad avvicinarsi non consuma la
 * finestra e viene registrato a parte come latenza. Così tutti hanno la stessa
 * opportunità effettiva e le percentuali restano confrontabili fra sessioni.
 *
 * In modalità difficile gira in parallelo il ciclo delle finestre utili: si
 * apre, si chiude, si riapre dopo una pausa, con durate estratte a caso negli
 * intervalli del livello. Lì cambia anche il significato della barra di
 * avanzamento, che conta le finestre centrate invece dei secondi di contatto:
 * la misura del tempo continua comunque a girare, ma serve solo a chiudere il
 * livello allo scadere della finestra, non a valutarlo.
 */
const LevelPlay = ({ level, food, difficulty, onComplete }: LevelPlayProps) => {
  const isHard = difficulty === 'difficile';

  const windowMs = level.target * 1000;

  const [starterTaps, setStarterTaps] = useState(0);
  const phase: 'intro' | 'play' = starterTaps >= STARTER_TAPS ? 'play' : 'intro';
  const completedRef = useRef(false);

  const { metrics, isDown, hasStarted, getResult } = useTouchTracker(phase === 'play');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const beat = level.hardBeat;

  const [beatActive, setBeatActive] = useState(false);
  const [goodTaps, setGoodTaps] = useState(0);
  const [miss, setMiss] = useState(false);
  const beatActiveRef = useRef(false);
  const missTimer = useRef<number | undefined>(undefined);
  const windowRef = useRef<{ openedAt: number } | null>(null);
  const pressStartRef = useRef<number | null>(null);
  const touchedRef = useRef(false);
  const scoredRef = useRef(false);
  /**
   * Le finestre centrate servono anche al timer di fine livello, che legge una
   * volta sola: se leggesse lo stato, ogni punto ne farebbe ripartire il conto
   * alla rovescia.
   */
  const goodTapsRef = useRef(0);

  useEffect(() => {
    beatActiveRef.current = beatActive;
  }, [beatActive]);

  const registerStarterTap = useCallback(() => {
    setStarterTaps((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (phase !== 'intro') return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code) || e.repeat) return;
      e.preventDefault();
      registerStarterTap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, registerStarterTap]);

  const triggerMiss = useCallback(() => {
    setMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(false), MISS_FLASH_MS);
  }, []);

  const scoreBeat = useCallback(() => {
    goodTapsRef.current += 1;
    setGoodTaps(goodTapsRef.current);
  }, []);

  useEffect(() => {
    if (!isHard || phase !== 'play') return undefined;
    let timer: number;

    const closeWindow = () => {
      const openedAt = windowRef.current?.openedAt ?? 0;
      windowRef.current = null;
      setBeatActive(false);

      if (beat.score === 'hold') {
        if (isHeldThrough(openedAt, pressStartRef.current)) scoreBeat();
        // Il contatto già in corso da prima dell'accensione non vale il punto:
        // senza questo lampeggio il bambino che tiene il dito appoggiato non
        // riceverebbe alcun riscontro, né positivo né negativo, per tutto il
        // livello. Chi invece non sta toccando non viene segnalato: aspettare la
        // finestra è il comportamento corretto, non un errore.
        else if (touchedRef.current || pressStartRef.current !== null) triggerMiss();
      } else if (!scoredRef.current && pressStartRef.current !== null) {
        triggerMiss();
      }
      touchedRef.current = false;
      scoredRef.current = false;

      timer = window.setTimeout(openWindow, sampleBeatMs(beat.offMs));
    };

    const openWindow = () => {
      windowRef.current = { openedAt: performance.now() };
      touchedRef.current = false;
      scoredRef.current = false;
      setBeatActive(true);
      timer = window.setTimeout(closeWindow, sampleBeatMs(beat.onMs));
    };

    timer = window.setTimeout(openWindow, FIRST_BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [isHard, phase, beat, triggerMiss, scoreBeat]);

  const onBeatPress = useCallback(() => {
    if (pressStartRef.current !== null) return;
    pressStartRef.current = performance.now();
    if (!beatActiveRef.current) triggerMiss();
    else if (beat.score === 'tap') {
      scoreBeat();
      scoredRef.current = true;
    } else touchedRef.current = true;
  }, [beat, triggerMiss, scoreBeat]);

  const onBeatRelease = useCallback(() => {
    if (pressStartRef.current === null) return;
    pressStartRef.current = null;
    if (beat.score === 'hold' && beatActiveRef.current && touchedRef.current) {
      touchedRef.current = false;
      triggerMiss();
    }
  }, [beat, triggerMiss]);

  useEffect(() => {
    if (!isHard || phase !== 'play') return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (MAKEY_KEYS.includes(e.code) && !e.repeat) onBeatPress();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (MAKEY_KEYS.includes(e.code)) onBeatRelease();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isHard, phase, onBeatPress, onBeatRelease]);

  useEffect(() => () => window.clearTimeout(missTimer.current), []);

  const contactSeconds = metrics.liveContactMs / 1000;

  useEffect(() => {
    if (phase !== 'play' || !hasStarted || completedRef.current) return undefined;

    const id = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current(getResult(windowMs), isHard ? goodTapsRef.current : null);
    }, windowMs);

    return () => window.clearTimeout(id);
  }, [phase, hasStarted, windowMs, getResult, isHard]);

  // In difficile l'obiettivo del livello sono le finestre centrate, non i secondi
  // di contatto: la barra deve misurare quello che il gioco chiede davvero.
  const progressPct = isHard
    ? Math.min(100, (goodTaps / beat.beatTarget) * 100)
    : Math.min(100, (contactSeconds / level.target) * 100);
  const progressText = isHard
    ? `🎵 Ritmo ${Math.min(goodTaps, beat.beatTarget)}/${beat.beatTarget}`
    : level.progressLabel(contactSeconds, level.target);
  const remainingSeconds = hasStarted
    ? Math.max(0, (windowMs - metrics.sessionDurationMs) / 1000)
    : level.target;

  const mood: RabbitMood =
    phase === 'intro' ? 'happy' : isDown ? ACTIVE_MOOD[level.id] ?? 'happy' : 'idle';

  const foodClass = [
    c.foodTarget,
    isDown ? c.foodTargetTouched : '',
    isHard && phase === 'play' && beatActive ? c.foodTargetActive : '',
    isHard && phase === 'play' && !beatActive ? c.foodTargetDim : '',
    miss ? c.foodTargetMiss : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={s.screen}>
      <div className={c.levelTag}>
        Livello {level.id} · {level.name}
        {isHard && <span className={c.diffBadge}>🎵 Difficile</span>}
      </div>

      <Rabbit mood={mood} />

      {phase === 'intro' ? (
        <div className={`${s.card} ${c.introCard}`}>
          <p className={c.introText}>{level.intro({ foodLabel: food.label })}</p>
          {isHard && (
            <p className={c.starterHint}>
              {beat.score === 'hold'
                ? `Modalità a tempo: quando ${food.label.toLowerCase()} si illumina tocca subito e ` +
                  `tieni premuto finché resta accesa! Ogni volta l'attesa e la durata cambiano. 🎵`
                : `Modalità a tempo: tocca ${food.label.toLowerCase()} solo quando si illumina! 🎵`}
            </p>
          )}
          <p className={c.starterHint}>
            Tocca {food.label.toLowerCase()} {STARTER_TAPS} volte per iniziare!
          </p>
          <div className={c.starterDots}>
            {Array.from({ length: STARTER_TAPS }).map((_, i) => (
              <span key={i} className={`${c.dot} ${i < starterTaps ? c.dotOn : ''}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className={c.progressWrap}>
          <div className={c.progressLabel}>{progressText}</div>
          <div className={c.progressBar}>
            <div className={c.progressBarFill} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={c.liveMetrics}>
            <span>👆 {metrics.count}</span>
            <span>⏱ {(metrics.liveContactMs / 1000).toFixed(1)}s</span>
            <span>⏳ {remainingSeconds.toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* Solo visualizzazione: il contatto si legge dal Makey Makey (Space) su
          `window`, mai da questo elemento. Se contasse il tocco sullo schermo il
          bambino potrebbe completare il livello senza toccare l'alimento, e il
          dato non misurerebbe più il comportamento target. Vedi useTouchTracker. */}
      <button type="button" className={foodClass} aria-label={`Tocca ${food.label}`}>
        <span className={c.foodTargetEmoji}>{food.emoji}</span>
      </button>

      <p className={c.hint}>
        {phase !== 'play'
          ? ''
          : isHard
            ? !beatActive
              ? 'Aspetta che si illumini…'
              : beat.score === 'hold'
                ? '🎵 Tieni premuto!'
                : '🎵 Tocca ora!'
            : !hasStarted
              ? 'Tocca il cibo: il tempo parte da lì!'
              : level.hint}
      </p>
    </div>
  );
};

export default LevelPlay;
