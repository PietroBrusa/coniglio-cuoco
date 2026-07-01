import { useCallback, useEffect, useRef, useState } from 'react';
import Rabbit from '../shared/Rabbit';
import { useTouchTracker, MAKEY_KEYS } from '../hooks/useTouchTracker';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '../types';
import s from '../styles/shared.module.scss';
import c from './LevelPlay.module.scss';

/** Number of starter taps required in the intro phase before measurement begins. */
const STARTER_TAPS = 3;

// Hard-mode ("piano tiles") timing parameters.
const BEAT_ON_MS = 600;  // duration of the "lit" window (tile on)
const BEAT_OFF_MS = 700; // pause between windows (tile off)
const MISS_FLASH_MS = 250; // red-flash duration for an off-beat tap

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

  const [beatActive, setBeatActive] = useState(false);
  const [goodTaps, setGoodTaps] = useState(0);
  const [miss, setMiss] = useState(false);
  const beatActiveRef = useRef(false);
  const prevDownRef = useRef(false);
  const missTimer = useRef<number | undefined>(undefined);

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

  // Beat scheduler: toggles the food highlight by alternating the two timing windows.
  useEffect(() => {
    if (!isHard || phase !== 'play') return undefined;
    let active = false;
    let timer: number;
    const tick = () => {
      active = !active;
      setBeatActive(active);
      timer = window.setTimeout(tick, active ? BEAT_ON_MS : BEAT_OFF_MS);
    };
    timer = window.setTimeout(tick, 800);
    return () => window.clearTimeout(timer);
  }, [isHard, phase]);

  // Signals an off-beat tap with a short red flash.
  const triggerMiss = useCallback(() => {
    setMiss(true);
    window.clearTimeout(missTimer.current);
    missTimer.current = window.setTimeout(() => setMiss(false), MISS_FLASH_MS);
  }, []);

  // On the rising edge of a touch: if the food is lit it counts as on-beat,
  // otherwise it is a miss. Raw touches are always recorded by the tracker
  // regardless, so clinical metrics remain unaffected.
  useEffect(() => {
    if (!isHard || phase !== 'play') {
      prevDownRef.current = isDown;
      return;
    }
    const wasDown = prevDownRef.current;
    prevDownRef.current = isDown;
    if (isDown && !wasDown) {
      if (beatActiveRef.current) setGoodTaps((g) => g + 1);
      else triggerMiss();
    }
  }, [isDown, isHard, phase, triggerMiss]);

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
  const progressText = isHard
    ? `A tempo ${Math.min(goodTaps, level.target)} / ${level.target}`
    : level.progressLabel(progressValue, level.target);

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
              Modalità a tempo: tocca {food.label.toLowerCase()} solo quando si illumina! 🎵
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
          ? pointerHandlers
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
            ? beatActive
              ? '🎵 Tocca ora!'
              : 'Aspetta che si illumini…'
            : level.hint}
      </p>
    </div>
  );
};

export default LevelPlay;
