import Rabbit from '@/components/Rabbit/Rabbit';
import s from '@/app/styles/shared.module.scss';

interface PracticeSummaryProps {
  onNewSession: () => void;
}

const PracticeSummary = ({ onNewSession }: PracticeSummaryProps) => (
  <div className={s.screen}>
    <Rabbit mood="cheer" message="Che bella partita!" />
    <h2>Partita completata</h2>

    <div className={s.card}>
      <p>
        🎵 <strong>Modalità difficile</strong>: è solo una partita, senza raccolta dati.
      </p>
      <p>
        Non è stata registrata nessuna misurazione: questa partita non viene salvata e non
        compare né nei grafici né nelle esportazioni. Per raccogliere dati scegli la modalità
        facile.
      </p>
    </div>

    <div className={s.rewardActions}>
      <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onNewSession}>
        Nuova sessione 🔄
      </button>
    </div>
  </div>
);

export default PracticeSummary;
