import type { SavedSession } from '@/api/client';
import { FOODS } from './foods';

export interface FoodProgress {
  lastSessionNumber: number;
  lastDate: string;
  total: number;
}

export type ProgressByFood = Record<string, FoodProgress>;

const ID_BY_LABEL = new Map(FOODS.map((f) => [f.label.toLowerCase(), f.id]));

/** Sessions saved before `foodId` existed carry only the label: resolve it back to an id. */
const foodKeyOf = (session: SavedSession): string =>
  session.foodId ?? ID_BY_LABEL.get(session.food.toLowerCase()) ?? session.food;

/**
 * Where the child stands on each food, so the therapist does not have to remember
 * the session number across children. Keyed by food id.
 */
export function foodProgress(sessions: SavedSession[]): ProgressByFood {
  const byFood: ProgressByFood = {};

  for (const session of sessions) {
    const key = foodKeyOf(session);
    const current = byFood[key];

    if (!current) {
      byFood[key] = {
        lastSessionNumber: session.sessionNumber,
        lastDate: session.date,
        total: 1,
      };
      continue;
    }

    current.total += 1;
    if (session.sessionNumber >= current.lastSessionNumber) {
      current.lastSessionNumber = session.sessionNumber;
      current.lastDate = session.date;
    }
  }

  return byFood;
}

/** The number to propose for the next session with a food: 1 when it was never used. */
export const nextSessionNumber = (progress?: FoodProgress): number =>
  (progress?.lastSessionNumber ?? 0) + 1;
