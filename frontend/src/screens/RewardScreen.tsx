import { useEffect } from 'react';
import Rabbit from '../shared/Rabbit';
import { formatMetrics } from '../utils/exportSession';
import { computeStars } from '../game/stars';
import { loadSettings } from '../game/settings';
import { playVictory } from '../utils/sound';
import type { Difficulty, Level, Metrics } from '../types';
import s from '../styles/shared.module.scss';
import c from './RewardScreen.module.scss';

interface RewardScreenProps {
  /** The level that was just completed. */
  level: Level;
  /** Metrics snapshot from the completed level. */
  metrics: Metrics;
  /** Session difficulty (passed to {@link computeStars}). */
  difficulty: Difficulty;
  /** When `true` the "next" button reads "End session" instead of "Next level". */
  isLastLevel: boolean;
  /** Called when the child chooses to advance (next level or end session). */
  onNext: () => void;
  /** Called when the child chooses to repeat the current level. */
  onRepeat: () => void;
}

/**
 * End-of-level reward screen: displays the earned stars and a metrics summary,
 * with buttons to repeat the level or advance to the next one.
 */
const RewardScreen = ({
  level,
  metrics,
  difficulty,
  isLastLevel,
  onNext,
  onRepeat,
}: RewardScreenProps) => {
  const settings = loadSettings();
  const stars = computeStars(metrics, level, difficulty, settings);

  // Celebrate the completed level with a short victory jingle (if enabled).
  useEffect(() => {
    if (settings.soundEnabled) playVictory();
    // Intentionally runs once on mount: one sound per reward screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.screen}>
      <Rabbit mood="cheer" message="Bravissimo!" />
      <h2>Livello {level.id} completato!</h2>

      <div className={c.stars} aria-label={`${stars} stelle su 3`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`${c.star} ${i <= stars ? c.starOn : ''}`}>
            ⭐
          </span>
        ))}
      </div>

      <div className={`${s.card} ${s.metricsSummary}`}>
        <h3>Riepilogo misurazioni</h3>
        <dl className={s.metricsGrid}>
          {formatMetrics(metrics).map((m) => (
            <div key={m.label} className={s.metric}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={s.rewardActions}>
        <button type="button" className={s.btn} onClick={onRepeat}>
          Ripeti livello 🔁
        </button>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onNext}>
          {isLastLevel ? 'Fine sessione 🏁' : 'Prossimo livello ▶'}
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;
