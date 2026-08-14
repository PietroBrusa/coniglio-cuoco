/**
 * Costruzione del record di sessione.
 *
 * Tutte le funzioni sono pure e restituiscono un nuovo oggetto invece di
 * modificare quello ricevuto: nessuna schermata può alterare per sbaglio la
 * sessione che un'altra sta mostrando, e ognuna si verifica con un test banale.
 *
 * @module
 */

import type { Difficulty, Level, Metrics, Session } from '@/types';
import { getFood } from './levels';

/**
 * Stabilisce se una sessione produce dati da registrare.
 *
 * La modalità difficile è **solo gioco**: il contatto vale unicamente mentre la
 * finestra è accesa, quindi il tempo di contatto che si misura dipende dal ritmo
 * imposto dall'app e non dal comportamento del bambino. Sarebbe un numero non
 * confrontabile con quello della modalità facile, e metterlo sullo stesso
 * grafico farebbe leggere come progresso o regressione ciò che è solo un cambio
 * di meccanica. Per questo una partita in difficile non viene registrata, non
 * viene salvata e non entra in grafici ed esportazioni.
 *
 * @param difficulty - Condizione della sessione, oppure `undefined` quando non
 * c'è ancora nessuna sessione aperta: prima della partenza non c'è niente da
 * escludere, quindi il caso vale come `facile`.
 * @returns `true` se gli esiti dei livelli vanno raccolti e salvati.
 */
export const collectsData = (difficulty: Difficulty | undefined): boolean =>
  difficulty !== 'difficile';

/**
 * Apre una nuova sessione, ancora priva di livelli.
 *
 * La data è fissata qui, all'avvio: è il momento in cui il lavoro con il bambino
 * comincia davvero.
 *
 * Dell'alimento arriva il solo identificativo, da cui l'etichetta viene
 * ricavata: così non esiste un modo di costruire una sessione in cui il nome
 * mostrato e la chiave dello storico si riferiscono a due alimenti diversi.
 *
 * @param params - Dati raccolti nella schermata di setup.
 * @returns Una sessione vuota, pronta a raccogliere gli esiti dei livelli.
 */
export function createSession({
  childId,
  sessionNumber,
  foodId,
  difficulty,
  therapist,
}: {
  /** Bambino che gioca; `anonimo` se non identificato. */
  childId: string;
  /** Numero progressivo proposto dal setup, o corretto a mano dal terapista. */
  sessionNumber: number;
  /** Identificativo dell'alimento scelto. */
  foodId: string;
  /** Condizione sperimentale scelta. */
  difficulty: Difficulty;
  /** Operatore che conduce la sessione. */
  therapist?: string;
}): Session {
  return {
    childId: childId || 'anonimo',
    sessionNumber: sessionNumber || 1,
    food: getFood(foodId).label,
    foodId,
    difficulty,
    therapist: therapist?.trim() ?? '',
    problemBehaviors: [],
    notes: '',
    date: new Date().toISOString(),
    levels: [],
  };
}

/**
 * Allega alla sessione le osservazioni che il terapista registra a lavoro
 * concluso.
 *
 * Sono raccolte alla fine, e non durante, perché richiedono uno sguardo
 * d'insieme sulla sessione: è anche il motivo per cui il salvataggio nel
 * database avviene una sola volta, alla fine.
 *
 * @param session - Sessione a cui aggiungere le osservazioni.
 * @param observations - Comportamenti problema selezionati e note libere.
 * @returns Una nuova sessione annotata.
 */
export function annotateSession(
  session: Session,
  { problemBehaviors, notes }: { problemBehaviors: string[]; notes: string }
): Session {
  return { ...session, problemBehaviors, notes: notes.trim() };
}

/**
 * Aggiunge alla sessione l'esito di un livello appena concluso.
 *
 * Copia nel record anche l'identità del livello (nome, definizione operazionale,
 * meccanica, obiettivo): il documento salvato resta così interpretabile anche
 * se in futuro i livelli dell'app cambiano.
 *
 * @param session - Sessione in corso.
 * @param result - Livello eseguito e misurazioni ottenute.
 * @returns Una nuova sessione con un livello in più.
 */
export function addLevelResult(
  session: Session,
  { level, metrics }: { level: Level; metrics: Metrics }
): Session {
  return {
    ...session,
    levels: [
      ...session.levels,
      {
        levelId: level.id,
        levelName: level.name,
        behavior: level.behavior,
        mode: level.mode,
        target: level.target,
        metrics: {
          n: metrics.count,
          latencyMs: metrics.latencyMs,
          totalContactMs: metrics.totalContactMs,
          meanTouchMs: metrics.meanTouchMs,
          meanIrtMs: metrics.meanIrtMs,
          sessionDurationMs: metrics.sessionDurationMs,
          engagementRatio: metrics.engagementRatio,
          touches: metrics.touches,
        },
      },
    ],
  };
}
