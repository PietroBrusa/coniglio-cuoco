/**
 * Trasformazione delle sessioni salvate nelle strutture dell'analisi ABA:
 * raggruppamento per alimento, serie del grafico e registrazione a intervalli.
 *
 * Sono funzioni pure, condivise dal grafico della dashboard e dall'esportazione
 * Excel: le due rappresentazioni non possono mostrare numeri diversi.
 *
 * @module
 */

import type { SavedSession } from '@/api/client';
import type { TouchRecord } from '@/types';

/**
 * Un punto del grafico: una sessione, per un livello.
 *
 * Porta solo le due coordinate: la data, l'alimento e il numero clinico della
 * sessione stanno già nella sessione salvata, e duplicarli qui significava
 * copiarli a ogni punto senza che nessuno li leggesse.
 */
export interface AbaPoint {
  /** Posizione sull'asse X: progressivo denso 1, 2, 3… (vedi {@link buildAbaSeries}). */
  ordinal: number;
  /** Valore rappresentato, cioè l'engagement ratio del livello. */
  value: number;
}

/** Le sessioni svolte con uno stesso alimento: una scheda, un grafico. */
export interface FoodGroup {
  /** Chiave di raggruppamento: l'identificativo dell'alimento, o il nome se manca. */
  key: string;
  /** Nome dell'alimento da mostrare. */
  food: string;
  /** Identificativo dell'alimento, assente nelle sessioni più vecchie. */
  foodId?: string;
  /** Le sessioni del gruppo, ordinate per numero crescente. */
  sessions: SavedSession[];
}

/** Una linea del grafico: l'andamento di un livello nel tempo. */
export interface AbaSeries {
  /** Livello rappresentato. */
  levelId: number;
  /** Nome del livello, usato in legenda. */
  levelName: string;
  /** I punti, uno per sessione in cui quel livello è stato eseguito. */
  points: AbaPoint[];
}

/** Esito di una registrazione a intervalli. */
export interface IntervalRecord {
  /** Un elemento per intervallo: `true` se il comportamento lo copre interamente. */
  marks: boolean[];
  /** Ampiezza dell'intervallo in millisecondi. */
  intervalMs: number;
  /** Quanti intervalli sono risultati positivi. */
  observed: number;
  /** Percentuale di intervalli positivi. */
  percent: number;
}

/** Ampiezza predefinita dell'intervallo: un secondo, come sulla scheda cartacea. */
export const DEFAULT_INTERVAL_MS = 1000;

/**
 * Descrive la condizione di una sessione, per la colonna omonima della scheda
 * ABA esportata.
 *
 * È la coppia alimento + difficoltà, cioè quello che la scheda cartacea riporta
 * accanto a ogni riga per dire in quali termini quella misura è stata raccolta.
 *
 * @param session - Sessione salvata.
 * @returns L'etichetta della condizione, es. `Carota · facile`.
 */
export const conditionOf = (session: SavedSession): string =>
  `${session.food} · ${session.difficulty ?? 'facile'}`;

/**
 * Raggruppa le sessioni per alimento.
 *
 * Ogni alimento è un programma a sé: confrontare la mela con il broccolo sullo
 * stesso grafico non avrebbe senso clinico. Da qui nascono le linguette della
 * dashboard e i fogli del file Excel.
 *
 * @param sessions - Sessioni salvate, in qualsiasi ordine.
 * @returns Un gruppo per alimento, con le sessioni già ordinate per numero.
 */
export function groupByFood(sessions: SavedSession[]): FoodGroup[] {
  const groups = new Map<string, FoodGroup>();

  for (const session of sortedByNumber(sessions)) {
    const key = session.foodId ?? session.food;
    let group = groups.get(key);
    if (!group) {
      group = { key, food: session.food, foodId: session.foodId, sessions: [] };
      groups.set(key, group);
    }
    group.sessions.push(session);
  }

  return [...groups.values()];
}

/**
 * Costruisce una linea del grafico per ogni livello, con l'engagement ratio come
 * valore rappresentato.
 *
 * Sull'asse X non va il numero clinico della sessione, che può avere buchi
 * (sessioni saltate o cancellate), ma un progressivo denso: così i punti restano
 * equidistanti e il grafico leggibile.
 *
 * @param sessions - Sessioni di un singolo alimento.
 * @returns Le serie ordinate per livello, così il colore di un livello è sempre
 * lo stesso in ogni grafico.
 */
export function buildAbaSeries(sessions: SavedSession[]): AbaSeries[] {
  const ordered = sortedByNumber(sessions);
  const ordinalOf = ordinalsFor(ordered);
  const byLevel = new Map<number, AbaSeries>();

  for (const session of ordered) {
    for (const level of session.levels) {
      let series = byLevel.get(level.levelId);
      if (!series) {
        series = { levelId: level.levelId, levelName: level.levelName, points: [] };
        byLevel.set(level.levelId, series);
      }
      series.points.push({
        ordinal: ordinalOf(session.sessionNumber),
        value: level.metrics.engagementRatio,
      });
    }
  }

  return [...byLevel.values()].sort((a, b) => a.levelId - b.levelId);
}

/**
 * Costruisce la corrispondenza fra numero clinico della sessione e posizione
 * sull'asse X.
 *
 * È esportata perché la stessa numerazione compare anche nell'elenco delle
 * sessioni della dashboard: ricavarla lì in un altro modo farebbe divergere le
 * due letture non appena due sessioni condividono lo stesso numero clinico —
 * cosa possibile, dato che il numero proposto dal setup è correggibile a mano.
 *
 * @param ordered - Sessioni di un alimento, già ordinate per numero crescente.
 * @returns Una funzione che traduce il numero clinico nella sua posizione, a
 * partire da 1. Numeri ripetuti condividono la stessa posizione.
 */
export function ordinalsFor(ordered: SavedSession[]): (sessionNumber: number) => number {
  const ordinals = new Map<number, number>();
  for (const session of ordered) {
    if (!ordinals.has(session.sessionNumber)) {
      ordinals.set(session.sessionNumber, ordinals.size + 1);
    }
  }
  return (sessionNumber) => ordinals.get(sessionNumber) ?? sessionNumber;
}

/**
 * Registrazione a intervalli interi (*whole interval recording*).
 *
 * La finestra viene divisa in intervalli uguali e un intervallo è marcato
 * positivo **solo se il contatto lo copre per intero**. È la procedura più
 * severa delle tre in uso: tende a sottostimare il comportamento, ed è quindi la
 * scelta conservativa per un comportamento che si vuole *aumentare* — non si
 * dichiara un progresso che non c'è. La registrazione a intervalli parziali
 * (positiva se il comportamento compare almeno una volta) sovrastima, ed è
 * indicata per i comportamenti da ridurre.
 *
 * @param touches - Contatti registrati, con tempi relativi all'inizio della misura.
 * @param sessionDurationMs - Durata della finestra da suddividere.
 * @param intervalMs - Ampiezza dell'intervallo; per impostazione predefinita un secondo.
 * @returns I segni `+`/`−` intervallo per intervallo e la percentuale di positivi.
 * Con durata o ampiezza non valide restituisce un esito vuoto invece di dividere per zero.
 */
export function wholeIntervalRecording(
  touches: TouchRecord[],
  sessionDurationMs: number,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): IntervalRecord {
  if (sessionDurationMs <= 0 || intervalMs <= 0) {
    return { marks: [], intervalMs, observed: 0, percent: 0 };
  }

  const intervals = Math.max(1, Math.round(sessionDurationMs / intervalMs));
  const marks: boolean[] = [];

  for (let i = 0; i < intervals; i += 1) {
    const from = i * intervalMs;
    marks.push(isFullyCovered(touches, from, from + intervalMs));
  }

  const observed = marks.filter(Boolean).length;
  return { marks, intervalMs, observed, percent: (observed / intervals) * 100 };
}

/**
 * Verifica se l'intervallo `[from, to)` è coperto senza interruzioni.
 *
 * Scorre i contatti una volta sola tenendo traccia del punto fin dove la
 * copertura arriva: contatti adiacenti o sovrapposti coprono l'intervallo
 * insieme, mentre il primo buco fa fallire la verifica.
 */
function isFullyCovered(touches: TouchRecord[], from: number, to: number): boolean {
  let covered = from;
  for (const touch of touches) {
    if (touch.up <= covered) continue;
    if (touch.down > covered) return false;
    covered = touch.up;
    if (covered >= to) return true;
  }
  return covered >= to;
}

/** Ordina per numero di sessione senza modificare l'array ricevuto. */
const sortedByNumber = (sessions: SavedSession[]): SavedSession[] =>
  [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
