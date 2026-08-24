export interface ProblemBehavior {
  id: string;
  emoji: string;
  label: string;
}

export const NO_PROBLEM_ID = 'nessuno';
//Lista di comportamenti problematici
export const PROBLEM_BEHAVIORS: ProblemBehavior[] = [
  { id: 'rifiuto-cibo', emoji: '🚫', label: 'Rifiuto del cibo' },
  { id: 'avversione-sessione', emoji: '😖', label: 'Avversione alla sessione' },
  { id: 'pianto', emoji: '😢', label: 'Pianto o lamento' },
  { id: 'allontanamento', emoji: '🏃', label: 'Allontanamento dal tavolo' },
  { id: 'conati', emoji: '🤢', label: 'Conati o espulsione del cibo' },
  { id: 'opposizione', emoji: '✋', label: 'Opposizione o rigidità' },
  //Nessun problema
  { id: NO_PROBLEM_ID, emoji: '✅', label: 'Nessun comportamento problema' },
];

//Restituisce unndefined se l'id non è in catalogo
export const getProblemBehavior = (id: string): ProblemBehavior | undefined =>
  PROBLEM_BEHAVIORS.find((b) => b.id === id);

//Selezione comportamento
export function toggleProblemBehavior(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((b) => b !== id);
  //Se seleziono NO_PROBLEM, esclude gli altri
  if (id === NO_PROBLEM_ID) return [NO_PROBLEM_ID];
  //Se il problema non è no problem, toglie no problem
  return [...selected.filter((b) => b !== NO_PROBLEM_ID), id];
}

//Se un problema non ha label torna l'id
export const problemBehaviorLabels = (ids: string[] = []): string[] =>
  ids.map((id) => getProblemBehavior(id)?.label ?? id);
