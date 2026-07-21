import type { SavedSession } from '../api/client';
import type { TouchRecord } from '../types';

export interface AbaPoint {
  sessionNumber: number;
  /**
   * X axis: position of the session *within its food group*, counting from 1.
   * Sessions run with other foods do not consume a slot, so each food's
   * programme reads as one continuous run.
   */
  ordinal: number;
  value: number;
  date: string;
  food: string;
}

/** Every session run with one food, i.e. one programme. */
export interface FoodGroup {
  /** Stable identity: the technical food id when recorded, else the label. */
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

/**
 * The vertical line drawn *between* two sessions when the condition changes, so
 * that trend is never read across a change of setup.
 */
export interface PhaseChange {
  atSessionNumber: number;
  atOrdinal: number;
  condition: string;
}

export interface IntervalRecord {
  /** One entry per interval: `true` = `+` (contact for the whole interval). */
  marks: boolean[];
  intervalMs: number;
  observed: number;
  percent: number;
}

/**
 * Length of one interval. The grid is scanned second by second, so a column is
 * a unit the therapist can actually observe and count out loud.
 */
export const DEFAULT_INTERVAL_MS = 1000;

/** The ABA "condition" of a session, e.g. `"Mela · difficile"`. */
export const conditionOf = (session: SavedSession): string =>
  `${session.food} · ${session.difficulty ?? 'facile'}`;

/**
 * Splits sessions into one group per food, ordered by first use. Sessions saved
 * before food ids existed fall back to the food label as their identity, so an
 * older programme still groups with itself.
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

/** One series per level, ordered by level id. Pass a single food's sessions. */
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

/**
 * Every session whose condition differs from the previous one starts a new
 * phase; the first session is not a change. Fed one food's sessions, the only
 * condition left to vary is the difficulty.
 */
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

/**
 * Numbers a run of sessions 1, 2, 3… by session number. Repeated numbers share
 * an ordinal, so a level appearing twice under the same session never splits it
 * into two slots on the X axis.
 */
function ordinalsFor(ordered: SavedSession[]): (sessionNumber: number) => number {
  const ordinals = new Map<number, number>();
  for (const session of ordered) {
    if (!ordinals.has(session.sessionNumber)) {
      ordinals.set(session.sessionNumber, ordinals.size + 1);
    }
  }
  return (sessionNumber) => ordinals.get(sessionNumber) ?? sessionNumber;
}

/**
 * Whole-interval recording: the window is split into one-second intervals and a
 * second counts (`+`) only if contact covered it from end to end. Deliberately
 * the strictest of the interval methods — it under-estimates the behaviour,
 * which is the conservative direction for a tolerance-building programme.
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
 * Whether `[from, to]` is entirely covered by the (ordered, non-overlapping)
 * touches. Coverage is computed by walking them rather than assuming a single
 * touch spans the second, so a second bridged by back-to-back touches still
 * scores.
 */
function isFullyCovered(touches: TouchRecord[], from: number, to: number): boolean {
  let covered = from;
  for (const touch of touches) {
    if (touch.up <= covered) continue; // ends before the uncovered part starts
    if (touch.down > covered) return false; // gap: contact was released
    covered = touch.up;
    if (covered >= to) return true;
  }
  return covered >= to;
}

const sortedByNumber = (sessions: SavedSession[]): SavedSession[] =>
  [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
