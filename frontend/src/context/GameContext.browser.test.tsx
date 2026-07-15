import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from 'vitest-browser-react';
import { AuthProvider } from './AuthContext';
import { GameProvider, useGame } from './GameContext';
import type { Metrics } from '../types';

/**
 * COMPONENT test for the game-flow context.
 *
 * The focus is the *idempotence* of the session record: a level result must be
 * appended to the session exactly once, and the session must be persisted
 * exactly once, no matter how many times the user navigates back and forth with
 * the browser buttons. A duplicate here silently corrupts the clinical dataset,
 * so it is worth pinning down.
 */

/** Minimal metrics fixture; `count` is the only field the assertions read. */
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

/** Renders the hook with a session already started on level 1. */
async function startedGame() {
  const { result } = await renderHook(() => useGame(), { wrapper });
  result.current.startSession({ sessionNumber: 1, foodId: 'carota', difficulty: 'facile' });
  await vi.waitFor(() => expect(result.current.session).not.toBeNull());
  return result;
}

beforeEach(() => localStorage.clear());

describe('GameContext', () => {
  it('appends a completed level to the session exactly once', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(5));
    await vi.waitFor(() => expect(result.current.lastResult).not.toBeNull());

    result.current.next();
    await vi.waitFor(() => expect(result.current.levelIndex).toBe(1));
    expect(result.current.session!.levels).toHaveLength(1);
  });

  it('does not append the result twice when "avanti" is pressed again after going back', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(5));
    await vi.waitFor(() => expect(result.current.lastResult).not.toBeNull());
    result.current.next();
    await vi.waitFor(() => expect(result.current.session!.levels).toHaveLength(1));

    // The user hits the browser's back button and presses "avanti" a second time:
    // `lastResult` is still set, so without a guard the reducer would append again.
    result.current.next();

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.session!.levels).toHaveLength(1);
    expect(result.current.levelIndex).toBe(1);
  });

  it('keeps only the latest attempt when a level is repeated', async () => {
    const result = await startedGame();

    result.current.completeLevel(metrics(3)); // first attempt
    await vi.waitFor(() => expect(result.current.lastResult!.count).toBe(3));

    result.current.completeLevel(metrics(9)); // repeated level, better attempt
    await vi.waitFor(() => expect(result.current.lastResult!.count).toBe(9));

    result.current.next();
    await vi.waitFor(() => expect(result.current.session!.levels).toHaveLength(1));
    expect(result.current.session!.levels[0].metrics.n).toBe(9);
  });

  it('tracks whether the session has already been saved', async () => {
    const result = await startedGame();
    expect(result.current.sessionSaved).toBe(false);

    result.current.markSessionSaved();
    await vi.waitFor(() => expect(result.current.sessionSaved).toBe(true));

    // A brand-new session must be saveable again.
    result.current.startSession({ sessionNumber: 2, foodId: 'mela', difficulty: 'facile' });
    await vi.waitFor(() => expect(result.current.sessionSaved).toBe(false));
  });
});
