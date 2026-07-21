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
  level: Level;
  metrics: Metrics;
  difficulty: Difficulty;
  /** When `true` the "next" button reads "End session" instead of "Next level". */
  isLastLevel: boolean;
  onNext: () => void;
  onRepeat: () => void;
}

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
