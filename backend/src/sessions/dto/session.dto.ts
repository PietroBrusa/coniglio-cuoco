/**
 * Forma delle sessioni restituite dall'API.
 *
 * Descritte a Swagger per finire nello spec OpenAPI, da cui viene generato il
 * client TypeScript del frontend: è il motivo per cui frontend e backend non
 * possono divergere senza che la compilazione se ne accorga.
 *
 * @module
 */

import { LevelResultDto } from './create-session.dto';

/** Una sessione salvata, come torna al client. */
export class SessionDto {
  /** Identificativo assegnato da MongoDB, usato per aprire o cancellare la sessione. */
  _id!: string;

  /** Bambino a cui appartiene, imposto dal server in base al token. */
  childId!: string;

  /** Numero progressivo della sessione per quel bambino su quell'alimento. */
  sessionNumber!: number;

  /** Nome dell'alimento. */
  food!: string;

  /** Identificativo dell'alimento, chiave dello storico per alimento. */
  foodId!: string;

  /** Condizione sperimentale della sessione; in pratica sempre `facile`. */
  difficulty!: 'facile' | 'difficile';

  /** Operatore che ha condotto la sessione; stringa vuota se non registrato. */
  therapist!: string;

  /** Identificativi dei comportamenti problema osservati; lista vuota se nessuno. */
  problemBehaviors!: string[];

  /** Osservazioni libere del terapista; stringa vuota se non ne ha scritte. */
  notes!: string;

  /** Data e ora di inizio dichiarate dal client, in formato ISO 8601. */
  date!: string;

  /** Esito di ogni livello eseguito. */
  levels!: LevelResultDto[];

  /** Data di scrittura sul server: è quella su cui si ordina l'elenco. */
  createdAt!: string;
}

/** Conferma di cancellazione. */
export class DeleteResultDto {
  /** Sempre `true`: un fallimento arriva come errore HTTP, non come risposta negativa. */
  deleted!: boolean;

  /** Identificativo della sessione cancellata. */
  id!: string;
}
