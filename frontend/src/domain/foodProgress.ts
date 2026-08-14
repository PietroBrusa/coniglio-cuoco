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

/**
 * Riassume, alimento per alimento, a che punto è il bambino.
 *
 * Il raggruppamento usa `foodId` e non l'etichetta: l'identificativo è imposto
 * dall'API, mentre l'etichetta è testo che potrebbe cambiare senza che le
 * sessioni già salvate ne sappiano nulla.
 *
 * @param sessions - Tutte le sessioni salvate del bambino, in qualsiasi ordine.
 * @returns L'avanzamento indicizzato per identificativo di alimento.
 */
export function foodProgress(sessions: SavedSession[]): ProgressByFood {
  const byFood: ProgressByFood = {};

  for (const session of sessions) {
    const current = byFood[session.foodId];

    if (!current) {
      byFood[session.foodId] = {
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
