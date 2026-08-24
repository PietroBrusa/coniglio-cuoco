import type { SavedSession } from '@/api/client';
import type { TouchRecord } from '@/types';

export interface AbaPoint {
  ordinal: number;
  value: number;
}

export interface FoodGroup {
  foodId: string;
  food: string;
  sessions: SavedSession[];
}

export interface AbaSeries {
  levelId: number;
  levelName: string;
  points: AbaPoint[];
}

export interface IntervalRecord {
  marks: boolean[];
  intervalMs: number;
  observed: number;
  percent: number;
}

export const DEFAULT_INTERVAL_MS = 1000;

export const conditionOf = (session: SavedSession): string =>
  `${session.food} · ${session.difficulty}`;
//ordina le sessioni in base a un alimento
export function groupByFood(sessions: SavedSession[]): FoodGroup[] {
  const groups = new Map<string, FoodGroup>();

  for (const session of sortedByNumber(sessions)) {
    let group = groups.get(session.foodId);
    if (!group) {
      group = { foodId: session.foodId, food: session.food, sessions: [] };
      groups.set(session.foodId, group);
    }
    group.sessions.push(session);
  }

  return [...groups.values()];
}

//preparazione per disegno sulla pagina della sessione, ordinando per livello
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

export function ordinalsFor(ordered: SavedSession[]): (sessionNumber: number) => number {
  const ordinals = new Map<number, number>();
  for (const session of ordered) {
    if (!ordinals.has(session.sessionNumber)) {
      //size + 1 = prossima posizione libera, nell'ordine di prima apparizione
      ordinals.set(session.sessionNumber, ordinals.size + 1);
    }
  }
  //closure sulla mappa, fallback se il numero non c'era in fase di costruzione
  return (sessionNumber) => ordinals.get(sessionNumber) ?? sessionNumber;
}

//gestione della tabella di intervalli
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

function isFullyCovered(touches: TouchRecord[], from: number, to: number): boolean {
  let covered = from;
  for (const touch of touches) {
    if (touch.up <= covered) continue;
    //buco nella copertura: esce subito, non controlla i tocchi restanti
    if (touch.down > covered) return false;
    //il tocco estende la copertura fin qui
    covered = touch.up;
    if (covered >= to) return true;
  }
  return covered >= to;
}

const sortedByNumber = (sessions: SavedSession[]): SavedSession[] =>
  [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
