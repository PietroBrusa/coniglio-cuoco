import { describe, it, expect } from 'vitest';
import {
  NO_PROBLEM_ID,
  PROBLEM_BEHAVIORS,
  getProblemBehavior,
  problemBehaviorLabels,
  toggleProblemBehavior,
} from './problemBehaviors';

describe('PROBLEM_BEHAVIORS', () => {
  it('exposes unique ids', () => {
    const ids = PROBLEM_BEHAVIORS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the mutually exclusive "no problem" entry', () => {
    expect(getProblemBehavior(NO_PROBLEM_ID)?.label).toBe('Nessun comportamento problema');
  });
});

describe('toggleProblemBehavior', () => {
  it('adds a behaviour that was not selected', () => {
    expect(toggleProblemBehavior([], 'pianto')).toEqual(['pianto']);
  });

  it('removes a behaviour that was already selected', () => {
    expect(toggleProblemBehavior(['pianto', 'conati'], 'pianto')).toEqual(['conati']);
  });

  it('clears every other behaviour when "no problem" is picked', () => {
    expect(toggleProblemBehavior(['pianto', 'conati'], NO_PROBLEM_ID)).toEqual([NO_PROBLEM_ID]);
  });

  it('drops "no problem" as soon as a real behaviour is picked', () => {
    expect(toggleProblemBehavior([NO_PROBLEM_ID], 'pianto')).toEqual(['pianto']);
  });

  it('lets "no problem" be unselected, leaving nothing behind', () => {
    expect(toggleProblemBehavior([NO_PROBLEM_ID], NO_PROBLEM_ID)).toEqual([]);
  });
});

describe('problemBehaviorLabels', () => {
  it('maps ids to the labels used on the ABA data sheets', () => {
    expect(problemBehaviorLabels(['rifiuto-cibo', 'pianto'])).toEqual([
      'Rifiuto del cibo',
      'Pianto o lamento',
    ]);
  });

  it('falls back to the raw id for behaviours no longer in the catalogue', () => {
    expect(problemBehaviorLabels(['sconosciuto'])).toEqual(['sconosciuto']);
  });

  it('handles a session with no behaviours recorded', () => {
    expect(problemBehaviorLabels()).toEqual([]);
  });
});
