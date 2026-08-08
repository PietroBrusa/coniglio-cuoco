/**
 * Comportamenti problema (CP) osservabili durante una sessione.
 *
 * Sono un elenco chiuso e non testo libero: così lo stesso comportamento viene
 * nominato allo stesso modo da operatori diversi e i dati restano aggregabili
 * nella scheda ABA.
 *
 * @module
 */

/** Un comportamento problema selezionabile a fine sessione. */
export interface ProblemBehavior {
  /** Identificativo salvato nel database, es. `rifiuto-cibo`. */
  id: string;
  /** Emoji che accompagna l'etichetta nell'interfaccia. */
  emoji: string;
  /** Descrizione mostrata al terapista e riportata nella scheda ABA. */
  label: string;
}

/** Segnala una sessione priva di comportamenti problema; esclude tutti gli altri. */
export const NO_PROBLEM_ID = 'nessuno';

/** Comportamenti problema con cui il terapista può etichettare una sessione conclusa. */
export const PROBLEM_BEHAVIORS: ProblemBehavior[] = [
  { id: 'rifiuto-cibo', emoji: '🚫', label: 'Rifiuto del cibo' },
  { id: 'avversione-sessione', emoji: '😖', label: 'Avversione alla sessione' },
  { id: 'pianto', emoji: '😢', label: 'Pianto o lamento' },
  { id: 'allontanamento', emoji: '🏃', label: 'Allontanamento dal tavolo' },
  { id: 'conati', emoji: '🤢', label: 'Conati o espulsione del cibo' },
  { id: 'opposizione', emoji: '✋', label: 'Opposizione o rigidità' },
  { id: NO_PROBLEM_ID, emoji: '✅', label: 'Nessun comportamento problema' },
];

/**
 * Cerca un comportamento problema per identificativo.
 *
 * @param id - Identificativo salvato nel record della sessione.
 * @returns Il comportamento, oppure `undefined` se l'identificativo non è più
 * fra quelli previsti (può accadere rileggendo sessioni vecchie).
 */
export const getProblemBehavior = (id: string): ProblemBehavior | undefined =>
  PROBLEM_BEHAVIORS.find((b) => b.id === id);

/**
 * Aggiunge o toglie un comportamento dalla selezione, mantenendo esclusivo
 * «nessun comportamento problema»: sceglierlo azzera gli altri, e scegliere un
 * altro lo rimuove.
 *
 * @param selected - Selezione corrente.
 * @param id - Comportamento su cui il terapista ha cliccato.
 * @returns La nuova selezione.
 */
export function toggleProblemBehavior(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((b) => b !== id);
  if (id === NO_PROBLEM_ID) return [NO_PROBLEM_ID];
  return [...selected.filter((b) => b !== NO_PROBLEM_ID), id];
}

/**
 * Traduce gli identificativi salvati nelle etichette leggibili usate dalla
 * schermata di riepilogo e dalle schede ABA.
 *
 * @param ids - Identificativi presenti nel record della sessione.
 * @returns Le etichette corrispondenti; un identificativo sconosciuto viene
 * riportato tale e quale, per non far sparire un dato dal referto.
 */
export const problemBehaviorLabels = (ids: string[] = []): string[] =>
  ids.map((id) => getProblemBehavior(id)?.label ?? id);
