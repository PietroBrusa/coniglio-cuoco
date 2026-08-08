/**
 * Documento di una sessione di gioco.
 *
 * @module
 */

import { Column, CreateDateColumn, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

/** Un singolo contatto con l'alimento, con tempi relativi al primo contatto. */
export interface TouchRecord {
  /** Millisecondi trascorsi all'inizio del contatto. */
  down: number;
  /** Millisecondi trascorsi alla fine del contatto. */
  up: number;
  /** Durata del contatto in millisecondi. */
  duration: number;
}

/** Misurazioni di un livello, come vengono conservate. */
export interface LevelResultMetrics {
  /** Numero di contatti registrati. */
  n: number;
  /** Latenza del primo contatto; `null` se non ha mai toccato. */
  latencyMs: number | null;
  /** Somma delle durate dei contatti. */
  totalContactMs: number;
  /** Durata media di un contatto; `null` senza contatti. */
  meanTouchMs: number | null;
  /** Tempo medio fra un contatto e il successivo; `null` con meno di due contatti. */
  meanIrtMs: number | null;
  /** Durata della finestra di misura. */
  sessionDurationMs: number;
  /** Percentuale di tempo a contatto: la metrica principale del programma. */
  engagementRatio: number;
  /** Dati grezzi, da cui ogni altra metrica si può ricalcolare. */
  touches: TouchRecord[];
}

/** Esito di un livello all'interno della sessione. */
export interface LevelResult {
  /** Numero del livello. */
  levelId: number;
  /** Nome del livello al momento dell'esecuzione. */
  levelName: string;
  /** Definizione operazionale del comportamento misurato. */
  behavior: string;
  /** Meccanica del livello. */
  mode: 'count' | 'hold';
  /** Obiettivo del livello, in secondi. */
  target: number;
  /** Misurazioni ottenute. */
  metrics: LevelResultMetrics;
}

/**
 * Una sessione nella collezione `sessions`.
 *
 * Il documento è auto-descrittivo: contiene i dati grezzi, quelli aggregati e
 * la definizione del comportamento misurato. Per rileggerlo fra qualche anno
 * non serve il codice dell'applicazione che lo ha prodotto — proprietà utile
 * per la conservazione di dati di ricerca.
 */
@Entity({ name: 'sessions' })
export class SessionEntity {
  /** Identificativo assegnato da MongoDB. */
  @ObjectIdColumn()
  _id!: ObjectId;

  /** Bambino a cui appartiene la sessione, imposto dal controller in base al token. */
  @Column()
  childId!: string;

  /** Numero progressivo della sessione per quel bambino su quell'alimento. */
  @Column()
  sessionNumber!: number;

  /** Nome dell'alimento. */
  @Column()
  food!: string;

  /** Identificativo dell'alimento. */
  @Column()
  foodId!: string;

  /** Condizione sperimentale della sessione. */
  @Column()
  difficulty!: 'facile' | 'difficile';

  /** Operatore che ha condotto la sessione. */
  @Column()
  therapist!: string;

  /** Identificativi dei comportamenti problema osservati. */
  @Column()
  problemBehaviors!: string[];

  /** Osservazioni libere del terapista. */
  @Column()
  notes!: string;

  /** Data e ora di inizio dichiarate dal client, in formato ISO 8601. */
  @Column()
  date!: string;

  /** Esito di ogni livello eseguito. */
  @Column()
  levels!: LevelResult[];

  /**
   * Data di scrittura, assegnata dal server.
   *
   * Distinta da `date`, che arriva dal client: l'ordinamento si basa su questa,
   * così resta corretto anche se l'orologio del tablet è sbagliato.
   */
  @CreateDateColumn()
  createdAt!: Date;
}
