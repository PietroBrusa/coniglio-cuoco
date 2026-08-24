import { useEffect, useRef, useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { useTouchTracker } from '@/hooks/useTouchTracker';
import { useMakeyKey } from '@/hooks/useMakeyKey';
import { useHardBeat } from '@/hooks/useHardBeat';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './LevelPlay.module.scss';

const STARTER_TAPS = 3;

const ACTIVE_MOOD: Record<number, RabbitMood> = { 1: 'happy', 2: 'sniff', 3: 'eat' };

interface LevelPlayProps {
  level: Level;
  food: Food;
  difficulty: Difficulty;
  onComplete: (result: Metrics, beatsScored: number | null) => void;
}

const LevelPlay = ({ level, food, difficulty, onComplete }: LevelPlayProps) => {
  const isHard = difficulty === 'difficile';

  const windowMs = level.target * 1000;
  const beat = level.hardBeat;

  //fase di conteggio dei tre tocchi prima del livello
  const [starterTaps, setStarterTaps] = useState(0);
  const phase: 'intro' | 'play' = starterTaps >= STARTER_TAPS ? 'play' : 'intro';
  const completedRef = useRef(false);

  const { metrics, isDown, hasStarted, getResult } = useTouchTracker(phase === 'play');
  const rhythm = useHardBeat(beat, isHard && phase === 'play');


  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useMakeyKey(phase === 'intro', {
    onPress: () => setStarterTaps((prev) => prev + 1),
  });

  const { getScored } = rhythm;

  //gestione della raccolta dei dati, se easy prende i risultati, se hard manda null
  useEffect(() => {
    if (phase !== 'play' || !hasStarted || completedRef.current) return undefined;

    //fa partire il timer di windowMs millisecondi
    const id = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      //chiama la versione più recente di oncomplete, che si occupa di salvare i risultati e navigare
      onCompleteRef.current(getResult(windowMs), isHard ? getScored() : null);
    }, windowMs);

    return () => window.clearTimeout(id);
  }, [phase, hasStarted, windowMs, getResult, isHard, getScored]);

  const contactSeconds = metrics.liveContactMs / 1000;

  const progressPct = isHard
    ? Math.min(100, (rhythm.scored / beat.beatTarget) * 100)
    : Math.min(100, (contactSeconds / level.target) * 100);
  const progressText = isHard
    ? `Ritmo ${Math.min(rhythm.scored, beat.beatTarget)}/${beat.beatTarget}`
    : level.progressLabel(contactSeconds, level.target);
  const remainingSeconds = hasStarted
    ? Math.max(0, (windowMs - metrics.sessionDurationMs) / 1000)
    : level.target;

  const mood: RabbitMood =
    phase === 'intro' ? 'happy' : isDown ? ACTIVE_MOOD[level.id] ?? 'happy' : 'idle';

  const foodClass = [
    c.foodTarget,
    isDown ? c.foodTargetTouched : '',
    isHard && phase === 'play' && rhythm.windowOpen ? c.foodTargetActive : '',
    isHard && phase === 'play' && !rhythm.windowOpen ? c.foodTargetDim : '',
    rhythm.miss ? c.foodTargetMiss : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={s.screen}>
      <div className={c.levelTag}>
        Livello {level.id} · {level.name}
        {isHard && <span className={c.diffBadge}>Difficile</span>}
      </div>

      <Rabbit mood={mood} />

      {phase === 'intro' ? (
        <div className={`${s.card} ${c.introCard}`}>
          <p className={c.introText}>{level.intro({ foodLabel: food.label })}</p>
          {isHard && (
            <p className={c.starterHint}>
              {beat.score === 'hold'
                ? `Modalità a tempo: quando ${food.label.toLowerCase()} si illumina tocca subito e ` +
                `tieni premuto finché resta accesa! Ogni volta l'attesa e la durata cambiano.`
                : `Modalità a tempo: tocca ${food.label.toLowerCase()} solo quando si illumina!`}
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
            <span>Tocchi: {metrics.count}</span>
            <span>Contatto: {contactSeconds.toFixed(1)}s</span>
            <span>Resta: {remainingSeconds.toFixed(1)}s</span>
          </div>
        </div>
      )}

      {
        // Il pulsante non fa nulla, non vogliamo che venga premuto
      }
      <button type="button" className={foodClass} aria-label={`Tocca ${food.label}`}>
        <span className={c.foodTargetEmoji}>{food.emoji}</span>
      </button>

      <p className={c.hint}>
        {phase !== 'play'
          ? ''
          : isHard
            ? !rhythm.windowOpen
              ? 'Aspetta che si illumini…'
              : beat.score === 'hold'
                ? 'Tieni premuto!'
                : 'Tocca ora!'
            : !hasStarted
              ? 'Tocca il cibo: il tempo parte da lì!'
              : level.hint}
      </p>
    </div>
  );
};

export default LevelPlay;
