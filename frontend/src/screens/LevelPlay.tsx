import { useCallback, useEffect, useRef, useState } from 'react';
import Rabbit from '../shared/Rabbit';
import { useTouchTracker, MAKEY_KEYS } from '../hooks/useTouchTracker';
import { sampleBeatMs, isHeldThrough } from '../game/hardBeat';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '../types';
import s from '../styles/shared.module.scss';
import c from './LevelPlay.module.scss';

/** Number of starter taps required in the intro phase before measurement begins. */
const STARTER_TAPS = 3;

// Hard-mode ("piano tiles") timing parameters. The window and pause durations
// themselves come from the level's `hardBeat` ranges.
const FIRST_BEAT_MS = 800;  // delay before the first window opens
const MISS_FLASH_MS = 250;  // red-flash duration for a missed beat

/** Rabbit mood while the food is being touched, keyed by level id. */
const ACTIVE_MOOD: Record<number, RabbitMood> = { 1: 'happy', 2: 'sniff', 3: 'eat' };

interface LevelPlayProps {
  /** The level to play. */
  level: Level;
  /** The food selected at setup. */
  food: Food;
  /** Session difficulty (affects scoring mechanic). */
  difficulty: Difficulty;
  /**
   * Called with the final metrics snapshot when the goal is reached.
   * @param result - Frozen {@link Metrics} from {@link useTouchTracker.getResult}.
   */
  onComplete: (result: Metrics) => void;
}

/**
 * Game screen for a single level. Manages the intro phase (starter-tap countdown),
 * touch measurement via {@link useTouchTracker} and, in hard mode, the on-beat
 * scoring mechanic. Calls `onComplete` exactly once when the goal is reached.
 */
const LevelPlay = ({ level, food, difficulty, onComplete }: LevelPlayProps) => {
  const isHard = difficulty === 'difficile';

  const [starterTaps, setStarterTaps] = useState(0);
  // `phase` è derivato da `starterTaps`: nessuno stato/effect separato da sincronizzare.
  const phase: 'intro' | 'play' = starterTaps >= STARTER_TAPS ? 'play' : 'intro';
  const completedRef = useRef(false);

  const { metrics, isDown, pointerHandlers, getResult } = useTouchTracker(phase === 'play');

  const beat = level.hardBeat;

  const [beatActive, setBeatActive] = useState(false);
  const [goodTaps, setGoodTaps] = useState(0);
  const [miss, setMiss] = useState(false);
  const beatActiveRef = useRef(false);
  const missTimer = useRef<number | undefined>(undefined);
  /** The lit window currently open, or `null` while the food is dim. */
  const windowRef = useRef<{ openedAt: number } | null>(null);
  /** Start time of the press in progress, or `null` while nothing is touched. */
  const pressStartRef = useRef<number | null>(null);
  /** Whether the open window has already been touched (drives the miss flash). */
  const touchedRef = useRef(false);

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

  // Signals a missed beat with a short red flash.
  const triggerMiss = useCallback(() => {
    setMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(false), MISS_FLASH_MS);
  }, []);

  /** Credits one successfully played beat. */
  const scoreBeat = useCallback(() => setGoodTaps((g) => g + 1), []);

  // Beat scheduler: alternates a lit window and a dark pause, sampling both
  // durations from the level's ranges. Level 1 has a fixed cadence; levels 2 and
  // 3 randomise both how long the wait lasts and how long contact must be held.
  // A `hold` window is scored on close (a `tap` window scores on the touch
  // itself, see below), so the check lives here.
  useEffect(() => {
    if (!isHard || phase !== 'play') return undefined;
    let timer: number;

    const closeWindow = () => {
      const openedAt = windowRef.current?.openedAt ?? 0;
      windowRef.current = null;
      setBeatActive(false);

      if (beat.score === 'hold') {
        // Scored only if one continuous press spans the whole window: it must
        // still be down now, and have started around the moment it opened.
        if (isHeldThrough(openedAt, pressStartRef.current)) scoreBeat();
        else if (touchedRef.current) triggerMiss();
      }
      touchedRef.current = false;

      timer = window.setTimeout(openWindow, sampleBeatMs(beat.offMs));
    };

    const openWindow = () => {
      windowRef.current = { openedAt: performance.now() };
      touchedRef.current = false;
      setBeatActive(true);
      timer = window.setTimeout(closeWindow, sampleBeatMs(beat.onMs));
    };

    timer = window.setTimeout(openWindow, FIRST_BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [isHard, phase, beat, triggerMiss, scoreBeat]);

  // Hard-mode scoring reads the touch edges straight from the input events, not
  // from the tracker's `isDown` state, so a press is timed against the beat at
  // the moment it happens rather than after a re-render. Raw touches are still
  // recorded by the tracker regardless, so clinical metrics are unaffected.
  const onBeatPress = useCallback(() => {
    if (pressStartRef.current !== null) return; // already down
    pressStartRef.current = performance.now();
    if (!beatActiveRef.current) triggerMiss(); // pressed while the food is dim
    else if (beat.score === 'tap') scoreBeat();
    else touchedRef.current = true;
  }, [beat, triggerMiss, scoreBeat]);

  const onBeatRelease = useCallback(() => {
    if (pressStartRef.current === null) return; // not down
    pressStartRef.current = null;
    // A `hold` beat abandoned before its window closes fails right away, so the
    // feedback lands while the child is still in the act.
    if (beat.score === 'hold' && beatActiveRef.current && touchedRef.current) {
      touchedRef.current = false; // already reported — don't flash again on close
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

  // Progress toward the goal: on-beat taps (hard mode) or the level's base
  // mechanic (tap count for `count` mode, seconds of contact for `hold` mode).
  const progressValue = isHard
    ? goodTaps
    : level.mode === 'count'
      ? metrics.count
      : metrics.liveContactMs / 1000;

  // Fires onComplete exactly once when the progress value meets the goal.
  useEffect(() => {
    if (phase !== 'play' || completedRef.current) return;
    if (progressValue >= level.target) {
      completedRef.current = true;
      onComplete(getResult());
    }
  }, [phase, progressValue, level.target, getResult, onComplete]);

  const progressPct = Math.min(100, (progressValue / level.target) * 100);
  const hardProgressLabel = beat.score === 'hold' ? 'Tenuti' : 'A tempo';
  const progressText = isHard
    ? `${hardProgressLabel} ${Math.min(goodTaps, level.target)} / ${level.target}`
    : level.progressLabel(progressValue, level.target);

  const mood: RabbitMood =
    phase === 'intro' ? 'happy' : isDown ? ACTIVE_MOOD[level.id] ?? 'happy' : 'idle';

  // In hard mode the tracker's handlers are wrapped so the same pointer event
  // feeds both the measurement engine and the beat scoring.
  const playHandlers = !isHard
    ? pointerHandlers
    : {
        onPointerDown: (e: React.PointerEvent) => {
          pointerHandlers.onPointerDown(e);
          onBeatPress();
        },
        onPointerUp: () => {
          pointerHandlers.onPointerUp();
          onBeatRelease();
        },
        onPointerLeave: () => {
          pointerHandlers.onPointerLeave();
          onBeatRelease();
        },
        onPointerCancel: () => {
          pointerHandlers.onPointerCancel();
          onBeatRelease();
        },
      };

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
            <span>⏱ {(metrics.totalContactMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className={foodClass}
        aria-label={`Tocca ${food.label}`}
        {...(phase === 'play'
          ? playHandlers
          : {
              onPointerDown: (e: React.PointerEvent) => {
                e.preventDefault();
                registerStarterTap();
              },
            })}
      >
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
            : level.hint}
      </p>
    </div>
  );
};

export default LevelPlay;
