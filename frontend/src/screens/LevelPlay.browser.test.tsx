import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import LevelPlay from './LevelPlay';
import type { Food, Level } from '../types';

/**
 * COMPONENT test for the gameplay screen (Vitest browser mode, real Chromium).
 *
 * LevelPlay drives the actual game loop: an intro phase with a starter-tap
 * countdown, then measured play until the goal is reached, at which point it
 * calls `onComplete` exactly once. We use synthetic Level objects with small
 * targets so the count-mode loop can be exercised quickly and deterministically.
 * (The timing maths and event handling are covered by the useTouchTracker and
 * computeMetrics tests; here we test the screen's own orchestration.)
 */

const food: Food = { id: 'carota', label: 'Carota', emoji: '🥕' };

/** A count-mode level (tap goal) with a small target for fast tests. */
const countLevel: Level = {
  id: 1,
  name: 'La Raccolta',
  behavior: 'Approccio e contatto con le dita',
  mode: 'count',
  target: 2,
  quickTouchMs: 600,
  intro: ({ foodLabel }) => `Raccogli ${foodLabel}!`,
  hint: 'Tocca il cibo',
  progressLabel: (done, target) => `Raccolte ${done} / ${target}`,
};

const STARTER_TAPS = 3;

/** Locator for the food target button. */
const target = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole('button', { name: /Tocca Carota/ });

/** Taps the food target `n` times (down+up per tap via a real click). */
async function tap(screen: Awaited<ReturnType<typeof render>>, n: number) {
  for (let i = 0; i < n; i += 1) await target(screen).click();
}

describe('LevelPlay', () => {
  it('starts in the intro phase and shows the starter-tap prompt', async () => {
    const screen = await render(
      <LevelPlay level={countLevel} food={food} difficulty="facile" onComplete={vi.fn()} />,
    );
    await expect.element(screen.getByText('Raccogli Carota!')).toBeInTheDocument();
    await expect.element(screen.getByText(/volte per iniziare/)).toBeInTheDocument();
  });

  it('transitions from intro to play after the starter taps', async () => {
    const screen = await render(
      <LevelPlay level={countLevel} food={food} difficulty="facile" onComplete={vi.fn()} />,
    );

    await tap(screen, STARTER_TAPS);

    // The play-phase progress label appears (0 taps counted so far).
    await expect.element(screen.getByText('Raccolte 0 / 2')).toBeInTheDocument();
  });

  it('calls onComplete once when the tap goal is reached', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={countLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await tap(screen, STARTER_TAPS); // enter play
    await tap(screen, 2); // reach the target of 2

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const result = onComplete.mock.calls[0][0];
    expect(result.count).toBeGreaterThanOrEqual(2);
  });

  it('shows the hard-mode badge and beat hint on a difficile session', async () => {
    const screen = await render(
      <LevelPlay level={countLevel} food={food} difficulty="difficile" onComplete={vi.fn()} />,
    );
    // Static, in the intro: the difficulty badge and the timing-mode instruction.
    await expect.element(screen.getByText('🎵 Difficile')).toBeInTheDocument();
    await expect.element(screen.getByText(/solo quando si illumina/)).toBeInTheDocument();
  });
});
