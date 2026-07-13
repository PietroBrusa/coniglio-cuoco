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
  hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap' },
  intro: ({ foodLabel }) => `Raccogli ${foodLabel}!`,
  hint: 'Tocca il cibo',
  progressLabel: (done, target) => `Raccolte ${done} / ${target}`,
};

/**
 * A hard-mode `hold` level (as levels 2 and 3 are). The beat ranges are collapsed
 * to a single value so the test is deterministic: the real levels randomise them,
 * but the scoring rule under test is the same.
 */
const holdLevel: Level = {
  id: 2,
  name: "L'Annusata",
  behavior: 'Sollevare e avvicinare al viso, annusare',
  mode: 'hold',
  target: 1,
  quickTouchMs: 800,
  hardBeat: { onMs: [1000, 1000], offMs: [1000, 1000], score: 'hold' },
  intro: ({ foodLabel }) => `Annusa ${foodLabel}!`,
  hint: 'Tocca e mantieni con il naso',
  progressLabel: (done, target) => `Profumo ${done} / ${target}`,
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

/**
 * The hard-mode `hold` beat of levels 2 and 3: a lit window scores only when the
 * contact is held from its opening to its close. Driven through raw pointer
 * events (rather than a click) because the press and the release must straddle
 * the window on their own schedule.
 */
describe('LevelPlay in hard mode on a hold level', () => {
  const press = (el: Element) =>
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  const release = (el: Element) =>
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Renders, clears the starter taps and resolves once the food lights up. */
  async function playUntilLit(onComplete: () => void) {
    const screen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="difficile" onComplete={onComplete} />,
    );
    await tap(screen, STARTER_TAPS);
    await expect.element(screen.getByText('🎵 Tieni premuto!')).toBeInTheDocument();
    const el = await target(screen).element();
    return { screen, el };
  }

  it('explains that the wait and the hold change every time', async () => {
    const screen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="difficile" onComplete={vi.fn()} />,
    );
    await expect.element(screen.getByText(/l'attesa e la durata cambiano/)).toBeInTheDocument();
  });

  it('scores the beat when the contact is held until the window closes', async () => {
    const onComplete = vi.fn();
    const { el } = await playUntilLit(onComplete);

    press(el);
    await wait(1200); // outlast the 1000 ms window without releasing

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('does not score the beat when the contact is released too early', async () => {
    const onComplete = vi.fn();
    const { screen, el } = await playUntilLit(onComplete);

    press(el);
    await wait(200); // let go well before the window closes
    release(el);
    await wait(1200); // and let that window close

    expect(onComplete).not.toHaveBeenCalled();
    await expect.element(screen.getByText('Tenuti 0 / 1')).toBeInTheDocument();
  });
});
