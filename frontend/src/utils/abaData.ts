import type { SavedSession } from '../api/client';
import type { TouchRecord } from '../types';

export interface AbaPoint {
  sessionNumber: number;
  ordinal: number;
  value: number;
  date: string;
  food: string;
}

export interface FoodGroup {
  key: string;
  food: string;
  foodId?: string;
  sessions: SavedSession[];
}

export interface AbaSeries {
  levelId: number;
  levelName: string;
  points: AbaPoint[];
}

export interface PhaseChange {
  atSessionNumber: number;
  atOrdinal: number;
  condition: string;
}

export interface IntervalRecord {
  marks: boolean[];
  intervalMs: number;
  observed: number;
  percent: number;
}

export const DEFAULT_INTERVAL_MS = 1000;

export const conditionOf = (session: SavedSession): string =>
  `${session.food} · ${session.difficulty ?? 'facile'}`;

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
        sessionNumber: session.sessionNumber,
        ordinal: ordinalOf(session.sessionNumber),
        value: level.metrics.engagementRatio,
        date: session.date,
        food: session.food,
      });
    }
  }

  return [...byLevel.values()].sort((a, b) => a.levelId - b.levelId);
}

export function findPhaseChanges(sessions: SavedSession[]): PhaseChange[] {
  const ordered = sortedByNumber(sessions);
  const ordinalOf = ordinalsFor(ordered);
  const changes: PhaseChange[] = [];

  for (let i = 1; i < ordered.length; i += 1) {
    const condition = conditionOf(ordered[i]);
    if (condition !== conditionOf(ordered[i - 1])) {
      changes.push({
        atSessionNumber: ordered[i].sessionNumber,
        atOrdinal: ordinalOf(ordered[i].sessionNumber),
        condition,
      });
    }
  }

  return changes;
}

function ordinalsFor(ordered: SavedSession[]): (sessionNumber: number) => number {
  const ordinals = new Map<number, number>();
  for (const session of ordered) {
    if (!ordinals.has(session.sessionNumber)) {
      ordinals.set(session.sessionNumber, ordinals.size + 1);
    }
  }
  return (sessionNumber) => ordinals.get(sessionNumber) ?? sessionNumber;
}

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
    if (touch.down > covered) return false;
    covered = touch.up;
    if (covered >= to) return true;
  }
  return covered >= to;
}

const sortedByNumber = (sessions: SavedSession[]): SavedSession[] =>
  [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
