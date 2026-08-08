import Rabbit from '@/components/Rabbit/Rabbit';
import s from '@/app/styles/shared.module.scss';

/** Che cosa serve alla chiusura di una partita libera. */
interface PracticeSummaryProps {
  /** Chiude la partita e torna al setup. */
  onNewSession: () => void;
}

/**
 * Chiusura di una partita in modalità difficile.
 *
 * Prende il posto del riepilogo di sessione quando la partita non raccoglie dati
 * (vedi {@link domain/sessionRecord.collectsData}): niente misurazioni, niente
 * comportamenti problema, nessun salvataggio. È una schermata separata e non un
 * riepilogo svuotato perché così il pulsante di salvataggio non esiste proprio,
 * e non c'è modo di scrivere per sbaglio nel database un record che non deve
 * esistere.
 *
 * Il bambino riceve comunque la chiusura narrativa: quello che cambia è solo che
 * cosa resta nel database.
 */
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
