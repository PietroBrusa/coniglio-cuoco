import { useEffect } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { formatMetrics } from '@/domain/formatMetrics';
import { computeStars } from '@/domain/stars';
import { collectsData } from '@/domain/sessionRecord';
import { loadSettings } from '@/storage/settings';
import { playVictory } from '@/lib/sound';
import type { Difficulty, Level, Metrics } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './RewardScreen.module.scss';

interface RewardScreenProps {
  level: Level;
  metrics: Metrics;
  difficulty: Difficulty;
  beatsScored: number | null;
  isLastLevel: boolean;
  onNext: () => void;
  onRepeat: () => void;
}

const RewardScreen = ({
  level,
  metrics,
  difficulty,
  beatsScored,
  isLastLevel,
  onNext,
  onRepeat,
}: RewardScreenProps) => {
  const settings = loadSettings();
  //Calcolo delle stelle
  const stars = computeStars(metrics, level, settings, beatsScored);

  //Esegue il suono
  useEffect(() => {
    if (settings.soundEnabled) playVictory();
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

      {
        //se facile mostra il riepilogo, se difficile mostra che non ci sono misurazioni effettuate
      }
      {collectsData(difficulty) ? (
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
      ) : (
        <p className={c.practiceNote}>
          Ritmo: {beatsScored ?? 0} finestre centrate su {level.hardBeat.beatTarget}. Partita
          libera, nessuna misurazione registrata.
        </p>
      )}

      <div className={s.rewardActions}>
        <button type="button" className={s.btn} onClick={onRepeat}>
          Ripeti livello
        </button>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onNext}>
          {isLastLevel ? 'Fine sessione' : 'Prossimo livello'}
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;
