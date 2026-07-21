import { useCallback, useEffect, useRef, useState } from 'react';
import Rabbit from '../shared/Rabbit';
import { useTouchTracker, MAKEY_KEYS } from '../hooks/useTouchTracker';
import { sampleBeatMs, isHeldThrough } from '../game/hardBeat';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '../types';
import s from '../styles/shared.module.scss';
import c from './LevelPlay.module.scss';

const STARTER_TAPS = 3;

const FIRST_BEAT_MS = 800; // delay before the first hard-mode window opens
const MISS_FLASH_MS = 250; // red-flash duration for a missed beat

const ACTIVE_MOOD: Record<number, RabbitMood> = { 1: 'happy', 2: 'sniff', 3: 'eat' };

interface LevelPlayProps {
  level: Level;
  food: Food;
  difficulty: Difficulty;
  onComplete: (result: Metrics) => void;
}

/**
 * The level is a fixed measurement window — `level.target` seconds — that opens
 * on the child's first contact and closes on its own, whatever happened inside.
 * `onComplete` is called exactly once, when it closes.
 */
const LevelPlay = ({ level, food, difficulty, onComplete }: LevelPlayProps) => {
  const isHard = difficulty === 'difficile';

  const windowMs = level.target * 1000;

  const [starterTaps, setStarterTaps] = useState(0);
  const phase: 'intro' | 'play' = starterTaps >= STARTER_TAPS ? 'play' : 'intro';
  const completedRef = useRef(false);

  const { metrics, isDown, hasStarted, pointerHandlers, getResult } = useTouchTracker(
    phase === 'play',
  );

  // Held in a ref so a parent re-rendering with a fresh callback cannot restart
  // the window timer below, which would silently stretch the level.
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
  /** The lit window currently open, or `null` while the food is dim. */
  const windowRef = useRef<{ openedAt: number } | null>(null);
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

  const triggerMiss = useCallback(() => {
    setMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(false), MISS_FLASH_MS);
  }, []);

  const scoreBeat = useCallback(() => setGoodTaps((g) => g + 1), []);

  // Beat scheduler: alternates a lit window and a dark pause, sampling both
  // durations from the level's ranges. A `hold` window is scored on close (a
  // `tap` window scores on the touch itself), so the check lives here.
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
  // the moment it happens rather than after a re-render.
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

  // Hard mode measures the same thing as easy mode — the beats are the game, not
  // the measurement.
  const contactSeconds = metrics.liveContactMs / 1000;

  // Closes the level once the window has run out, exactly once. The window opens
  // on first contact, so an unstarted level simply waits.
  useEffect(() => {
    if (phase !== 'play' || !hasStarted || completedRef.current) return undefined;

    const id = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current(getResult(windowMs));
    }, windowMs);

    return () => window.clearTimeout(id);
  }, [phase, hasStarted, windowMs, getResult]);

  const progressPct = Math.min(100, (contactSeconds / level.target) * 100);
  const progressText = level.progressLabel(contactSeconds, level.target);
  const remainingSeconds = hasStarted
    ? Math.max(0, (windowMs - metrics.sessionDurationMs) / 1000)
    : level.target;

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
            <span>⏱ {(metrics.liveContactMs / 1000).toFixed(1)}s</span>
            <span>⏳ {remainingSeconds.toFixed(1)}s</span>
            {isHard && <span>🎵 {goodTaps}</span>}
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
        {/* In hard mode the lit food is already the instruction, and telling the
            child to touch would invite a touch while it is dim — a miss. */}
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
