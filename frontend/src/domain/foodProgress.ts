/**
 * Storico del bambino su ciascun alimento.
 *
 * Serve a proporre automaticamente il numero della sessione successiva: prima
 * era il terapista a doverlo ricordare, ed era una fonte ricorrente di errori di
 * numerazione.
 *
 * @module
 */

import type { SavedSession } from '@/api/client';
import { FOODS } from './foods';

/** A che punto è il programma su un singolo alimento. */
export interface FoodProgress {
  /** Numero della sessione più recente svolta con quell'alimento. */
  lastSessionNumber: number;
  /** Data ISO di quella sessione. */
  lastDate: string;
  /** Quante sessioni sono state svolte in tutto con quell'alimento. */
  total: number;
}

/** Avanzamento per ogni alimento usato, indicizzato per identificativo. */
export type ProgressByFood = Record<string, FoodProgress>;

const ID_BY_LABEL = new Map(FOODS.map((f) => [f.label.toLowerCase(), f.id]));

/**
 * Le sessioni salvate prima che esistesse `foodId` portano solo l'etichetta:
 * viene risolta all'indietro verso l'identificativo, altrimenti lo storico di
 * uno stesso alimento si spezzerebbe in due gruppi distinti.
 */
const foodKeyOf = (session: SavedSession): string =>
  session.foodId ?? ID_BY_LABEL.get(session.food.toLowerCase()) ?? session.food;

/**
 * Riassume, alimento per alimento, a che punto è il bambino.
 *
 * @param sessions - Tutte le sessioni salvate del bambino, in qualsiasi ordine.
 * @returns L'avanzamento indicizzato per identificativo di alimento.
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

/**
 * Numero da proporre per la prossima sessione con un alimento.
 *
 * @param progress - Avanzamento sull'alimento scelto, assente se mai usato.
 * @returns L'ultimo numero più uno, quindi `1` alla prima sessione. Resta una
 * proposta: il terapista può sempre sovrascriverla.
 */
export const nextSessionNumber = (progress?: FoodProgress): number =>
  (progress?.lastSessionNumber ?? 0) + 1;
