import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from 'vitest-browser-react';
import { AuthProvider } from './AuthContext';
import { GameProvider, useGame } from './GameContext';
import type { Difficulty, Metrics } from '@/types';

const metrics = (count: number): Metrics => ({
  count,
  latencyMs: 500,
  totalContactMs: 2000,
  liveContactMs: 2000,
  meanTouchMs: 400,
  meanIrtMs: 300,
  sessionDurationMs: 10000,
  engagementRatio: 20,
  touches: [],
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GameProvider>{children}</GameProvider>
    </AuthProvider>
  );
}

async function startedGame(difficulty: Difficulty = 'facile') {
  const { result } = await renderHook(() => useGame(), { wrapper });
  result.current.startSession({
    sessionNumber: 1,
    foodId: 'carota',
    difficulty,
    therapist: 'Mary Major',
  });
  await vi.waitFor(() => expect(result.current.session).not.toBeNull());
  return result;
}

beforeEach(() => localStorage.clear());

describe('GameContext', () => {
  it('appends a completed level to the session exactly once', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(5), null);
    await vi.waitFor(() => expect(result.current.lastResult).not.toBeNull());

    result.current.next();
    await vi.waitFor(() => expect(result.current.levelIndex).toBe(1));
    expect(result.current.session!.levels).toHaveLength(1);
  });

  it('does not append the result twice when "avanti" is pressed again after going back', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(5), null);
    await vi.waitFor(() => expect(result.current.lastResult).not.toBeNull());
    result.current.next();
    await vi.waitFor(() => expect(result.current.session!.levels).toHaveLength(1));

    result.current.next();

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.session!.levels).toHaveLength(1);
    expect(result.current.levelIndex).toBe(1);
  });

  it('keeps only the latest attempt when a level is repeated', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(3), null);
    await vi.waitFor(() => expect(result.current.lastResult!.count).toBe(3));

    result.current.completeLevel(metrics(9), null);
    await vi.waitFor(() => expect(result.current.lastResult!.count).toBe(9));

    result.current.next();
    await vi.waitFor(() => expect(result.current.session!.levels).toHaveLength(1));
    expect(result.current.session!.levels[0].metrics.count).toBe(9);
  });

  it('records nothing in a "difficile" session, which is play only', async () => {
    const result = await startedGame('difficile');
    expect(result.current.collectsData).toBe(false);

    result.current.completeLevel(metrics(5), 2);
    await vi.waitFor(() => expect(result.current.lastResult).not.toBeNull());

    result.current.next();

    await vi.waitFor(() => expect(result.current.levelIndex).toBe(1));
    expect(result.current.session!.levels).toEqual([]);
    // Il punteggio a tempo vive solo in memoria, per la stella: non entra nel record.
    expect(result.current.lastBeatScore).toBe(2);
  });

  it('tracks whether the session has already been saved', async () => {
    const result = await startedGame();
    expect(result.current.sessionSaved).toBe(false);

    result.current.markSessionSaved();
    await vi.waitFor(() => expect(result.current.sessionSaved).toBe(true));

    result.current.startSession({
      sessionNumber: 2,
      foodId: 'mela',
      difficulty: 'facile',
      therapist: 'Mary Major',
    });
    await vi.waitFor(() => expect(result.current.sessionSaved).toBe(false));
  });
});
