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

/** Che cosa serve alla schermata del premio. */
interface RewardScreenProps {
  /** Livello appena concluso. */
  level: Level;
  /** Misurazioni ottenute. */
  metrics: Metrics;
  /** Condizione della sessione: decide se mostrare le misurazioni. */
  difficulty: Difficulty;
  /**
   * Finestre centrate in modalità difficile, `null` in facile: è il criterio
   * della terza stella quando si è giocato a tempo.
   */
  beatsScored: number | null;
  /** Il livello concluso era l'ultimo: cambia l'etichetta del pulsante di avanzamento. */
  isLastLevel: boolean;
  /** Passa al livello successivo, o al riepilogo se era l'ultimo. */
  onNext: () => void;
  /** Ripete lo stesso livello. */
  onRepeat: () => void;
}

/**
 * Schermata di rinforzo: stelle guadagnate e riepilogo delle misurazioni del
 * livello.
 *
 * Le stelle sono il rinforzo per il bambino, le misurazioni l'informazione per
 * il terapista: stanno nella stessa schermata perché il momento in cui si
 * osservano è lo stesso.
 *
 * In modalità difficile le misurazioni non compaiono: la partita non raccoglie
 * dati (vedi {@link domain/sessionRecord.collectsData}) e mostrare numeri che
 * nessuno registrerà inviterebbe a leggerli come se fossero misure del
 * comportamento target. Al loro posto si vedono le finestre centrate, che lì
 * sono il criterio della terza stella: il rinforzo resta, ma segue il compito
 * che il bambino ha effettivamente svolto.
 */
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
  const stars = computeStars(metrics, level, settings, beatsScored);

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
          🎵 Ritmo: {beatsScored ?? 0} finestre centrate su {level.hardBeat.beatTarget}. Partita
          libera, nessuna misurazione registrata.
        </p>
      )}

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
