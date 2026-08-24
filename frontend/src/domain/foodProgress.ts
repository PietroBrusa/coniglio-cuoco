import type { SavedSession } from '@/api/client';

//Statistiche di ogni singolo cibo
export interface FoodProgress {
  //numero dell'ultima sessione
  lastSessionNumber: number;
  //data dell'ultima sessione
  lastDate: string;
  //sessioni totali
  total: number;
}

//Mappa con tutti i cibi con i quali il bambino ha lavorato
export type ProgressByFood = Record<string, FoodProgress>;


export function foodProgress(sessions: SavedSession[]): ProgressByFood {
  const byFood: ProgressByFood = {};

  //prende tutte le sessioni, le raggruppa per cibo
  for (const session of sessions) {
    //legge le sessioni del cibo
    const current = byFood[session.foodId];

    //se non ce ne sono, ne crea una
    if (!current) {
      byFood[session.foodId] = {
        lastSessionNumber: session.sessionNumber,
        lastDate: session.date,
        total: 1,
      };
      continue;
    }

    //aggiorna il conteggio, se il numero sessione è il più grande aggiorna data e numero;
    //a parità di numero (es. una correzione re-inserita) vince la data più recente,
    //non l'ordine con cui l'API le ha restituite
    current.total += 1;
    const isNewer =
      session.sessionNumber > current.lastSessionNumber ||
      (session.sessionNumber === current.lastSessionNumber && session.date > current.lastDate);
    if (isNewer) {
      current.lastSessionNumber = session.sessionNumber;
      current.lastDate = session.date;
    }
  }

  return byFood;
}

//Calcolo del prossimo numero della sessione da assegnare
export const nextSessionNumber = (progress?: FoodProgress): number =>
  (progress?.lastSessionNumber ?? 0) + 1;
