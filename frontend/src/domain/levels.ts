/**
 * La gerarchia di esposizione all'alimento, un livello per passo.
 *
 * I tre livelli riproducono l'avvicinamento per approssimazioni successive usato
 * nell'intervento sulla selettività alimentare: prima toccare, poi annusare,
 * infine assaggiare. Ogni passo è appena più impegnativo del precedente e viene
 * rinforzato.
 *
 * Sono dati, non codice: aggiungere un passo alla gerarchia significa aggiungere
 * un elemento all'array, senza toccare nessuna schermata.
 *
 * @module
 */

import type { Food, Level } from '@/types';
import { FOODS } from './foods';

export { FOODS };

/**
 * I livelli nell'ordine in cui vengono proposti.
 *
 * Hanno tutti `target: 6`, cioè una finestra di misura di sei secondi: lunga
 * abbastanza da produrre una misura stabile, breve abbastanza da restare
 * sostenibile per un bambino con selettività, in cui una richiesta prolungata
 * aumenta rifiuto e comportamenti problema.
 *
 * Il campo `hardBeat` cresce di livello in livello: al primo il ritmo è fisso e
 * basta toccare, dal secondo diventa variabile e bisogna mantenere il contatto.
 *
 * `beatTarget` scende mentre le finestre si allungano, perché in sei secondi ne
 * entrano sempre meno: al primo livello se ne aprono circa cinque, al terzo due.
 * È fissato a circa due terzi di quelle attese, non a tutte: il rinforzo segue
 * la partecipazione, non la prestazione perfetta.
 */
export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'La Raccolta',
    behavior: 'Approccio e contatto con le dita',
    mode: 'hold',
    target: 6,
    hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap', beatTarget: 3 },
    intro: ({ foodLabel }) =>
      `Benvenuto alla Fattoria del Coniglio! \n\n` +
      `Il piccolo Coniglio vive in una grande fattoria piena di cibi colorati. ` +
      `Oggi deve preparare ${foodLabel.toLowerCase()}!\n\n` +
      `Aiutalo a raccoglierle: tocca ${foodLabel.toLowerCase()} con le dita ` +
      `e tienila per riempire il cesto.`,
    hint: 'Tocca e tieni il cibo con le dita',
    progressLabel: (done, target) =>
      `Cesto ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
  {
    id: 2,
    name: "L'Annusata",
    behavior: 'Sollevare e avvicinare al viso, annusare',
    mode: 'hold',
    target: 6,
    hardBeat: { onMs: [600, 1400], offMs: [700, 1500], score: 'hold', beatTarget: 2 },
    intro: ({ foodLabel }) =>
      `Il coniglietto ha raccolto ${foodLabel.toLowerCase()}! 👃\n\n` +
      `Ora deve controllare che vada bene. Avvicina ${foodLabel.toLowerCase()} al naso ` +
      `e annusala con calma.\n\n` +
      `Mantieni il contatto per riempire la barra: prima tocchi brevi, poi più lunghi.`,
    hint: 'Tocca e mantieni con il naso',
    progressLabel: (done, target) =>
      `Profumo ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
  {
    id: 3,
    name: "L'Assaggio",
    behavior: 'Contatto con labbra / lingua',
    mode: 'hold',
    target: 6,
    hardBeat: { onMs: [900, 2000], offMs: [800, 2000], score: 'hold', beatTarget: 1 },
    intro: ({ foodLabel }) =>
      `${foodLabel} è pronta! \n\n` +
      `Il coniglietto chiama i suoi amici e distribuisce una fetta ciascuno. ` +
      `È il momento dell'assaggio!\n\n` +
      `Tocca ${foodLabel.toLowerCase()} con le labbra o la lingua. ` +
      `Prima tocchi brevi, poi più lunghi.`,
    hint: 'Tocca con labbra / lingua',
    progressLabel: (done, target) =>
      `Assaggio ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
];

/**
 * Cerca un alimento per identificativo.
 *
 * @param foodId - Identificativo dell'alimento, eventualmente assente nelle
 * sessioni salvate prima della sua introduzione.
 * @returns L'alimento richiesto, o il primo del catalogo se non viene trovato:
 * l'interfaccia ha sempre qualcosa da mostrare e non si rompe su un dato vecchio.
 */
export function getFood(foodId: string | undefined): Food {
  return FOODS.find((f) => f.id === foodId) ?? FOODS[0];
}

/**
 * Cerca un livello per numero.
 *
 * @param levelId - Numero del livello.
 * @returns Il livello richiesto, o il primo della gerarchia se non esiste.
 */
export function getLevel(levelId: number): Level {
  return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
}
