import Rabbit from '../shared/Rabbit';
import { formatMetrics } from '../utils/exportSession';
import type { Difficulty, Level, Metrics } from '../types';
import s from '../styles/shared.module.scss';
import c from './RewardScreen.module.scss';

// Star-rating thresholds (easy to adjust without touching the logic).
const PROMPT_LATENCY_MS = 3000; // "ready" approach: first tap within 3 s
const HOLD_ENGAGEMENT_PCT = 40; // engagement threshold for sustained-contact levels
const TAP_CONTACT_MS = 1500;    // contact threshold for tap-count levels / hard mode

/**
 * Computes the star rating (1–3) in a way that is fair across mechanics and
 * difficulty settings:
 * 1) always 1 star for completing the level;
 * 2) +1 for a prompt approach (low latency to first tap);
 * 3) +1 for sustained engagement, with a threshold suited to the active mechanic
 *    (engagement ratio for "hold" levels, total contact time for "tap" levels).
 * @param metrics - Live metrics from the completed level.
 * @param level - The level definition (used for `mode`).
 * @param difficulty - Session difficulty (affects which mechanic is used).
 * @returns Star count in the range [1, 3].
 */
function computeStars(metrics: Metrics, level: Level, difficulty: Difficulty): number {
  const mechanic: 'hold' | 'tap' =
    difficulty === 'difficile' || level.mode === 'count' ? 'tap' : 'hold';

  let stars = 1;

  if (metrics.latencyMs != null && metrics.latencyMs <= PROMPT_LATENCY_MS) stars += 1;

  const engaged =
    mechanic === 'hold'
      ? metrics.engagementRatio >= HOLD_ENGAGEMENT_PCT
      : metrics.totalContactMs >= TAP_CONTACT_MS;
  if (engaged) stars += 1;

  return Math.min(3, stars);
}

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
  const stars = computeStars(metrics, level, difficulty);

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
