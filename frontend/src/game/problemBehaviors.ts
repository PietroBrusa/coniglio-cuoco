export interface ProblemBehavior {
  id: string;
  emoji: string;
  label: string;
}

/** Marks a session as free of problem behaviours; mutually exclusive with the rest. */
export const NO_PROBLEM_ID = 'nessuno';

/** Problem behaviours (CP) the therapist can tag a session with, once it is over. */
export const PROBLEM_BEHAVIORS: ProblemBehavior[] = [
  { id: 'rifiuto-cibo', emoji: '🚫', label: 'Rifiuto del cibo' },
  { id: 'avversione-sessione', emoji: '😖', label: 'Avversione alla sessione' },
  { id: 'pianto', emoji: '😢', label: 'Pianto o lamento' },
  { id: 'allontanamento', emoji: '🏃', label: 'Allontanamento dal tavolo' },
  { id: 'conati', emoji: '🤢', label: 'Conati o espulsione del cibo' },
  { id: 'opposizione', emoji: '✋', label: 'Opposizione o rigidità' },
  { id: NO_PROBLEM_ID, emoji: '✅', label: 'Nessun comportamento problema' },
];

export const getProblemBehavior = (id: string): ProblemBehavior | undefined =>
  PROBLEM_BEHAVIORS.find((b) => b.id === id);

/**
 * Adds or removes a behaviour, keeping "nessun comportamento problema" exclusive:
 * picking it clears the others, picking any other clears it.
 */
export function toggleProblemBehavior(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((b) => b !== id);
  if (id === NO_PROBLEM_ID) return [NO_PROBLEM_ID];
  return [...selected.filter((b) => b !== NO_PROBLEM_ID), id];
}

/** Human-readable labels, for the summary screen and the ABA data sheets. */
export const problemBehaviorLabels = (ids: string[] = []): string[] =>
  ids.map((id) => getProblemBehavior(id)?.label ?? id);
