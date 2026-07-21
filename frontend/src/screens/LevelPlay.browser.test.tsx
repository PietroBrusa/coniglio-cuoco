import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import LevelPlay from './LevelPlay';
import type { Food, Level } from '../types';

/**
 * COMPONENT test for the gameplay screen (Vitest browser mode, real Chromium).
 *
 * LevelPlay drives the actual game loop: an intro phase with a starter-tap
 * countdown, then a fixed measurement window that opens on the child's first
 * contact and closes on its own, at which point `onComplete` is called exactly
 * once. Synthetic Level objects with one- and three-second windows keep the
 * tests fast and deterministic. (The timing maths and event handling are covered
 * by the useTouchTracker and computeMetrics tests; here we test the screen's own
 * orchestration.)
 */

const food: Food = { id: 'carota', label: 'Carota', emoji: '🥕' };

/** A level with a one-second window, so a test can watch it open and close. */
const quickLevel: Level = {
  id: 1,
  name: 'La Raccolta',
  behavior: 'Approccio e contatto con le dita',
  mode: 'hold',
  target: 1,
  hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap' },
  intro: ({ foodLabel }) => `Raccogli ${foodLabel}!`,
  hint: 'Tocca il cibo',
  progressLabel: (done, target) => `Cesto ${Math.min(100, Math.round((done / target) * 100))}%`,
};

/**
 * A hard-mode `hold` level (as levels 2 and 3 are). The beat ranges are collapsed
 * to a single value so the test is deterministic: the real levels randomise them,
 * but the scoring rule under test is the same. The window is three seconds, long
 * enough to contain a beat and still finish quickly.
 */
const holdLevel: Level = {
  id: 2,
  name: "L'Annusata",
  behavior: 'Sollevare e avvicinare al viso, annusare',
  mode: 'hold',
  target: 3,
  hardBeat: { onMs: [1000, 1000], offMs: [1000, 1000], score: 'hold' },
  intro: ({ foodLabel }) => `Annusa ${foodLabel}!`,
  hint: 'Tocca e mantieni con il naso',
  progressLabel: (done, target) => `Profumo ${Math.min(100, Math.round((done / target) * 100))}%`,
};

const STARTER_TAPS = 3;

/** Locator for the food target button. */
const target = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole('button', { name: /Tocca Carota/ });

/** Taps the food target `n` times (down+up per tap via a real click). */
async function tap(screen: Awaited<ReturnType<typeof render>>, n: number) {
  for (let i = 0; i < n; i += 1) await target(screen).click();
}

const press = (el: Element) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
const release = (el: Element) => el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('LevelPlay', () => {
  it('starts in the intro phase and shows the starter-tap prompt', async () => {
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={vi.fn()} />,
    );
    await expect.element(screen.getByText('Raccogli Carota!')).toBeInTheDocument();
    await expect.element(screen.getByText(/volte per iniziare/)).toBeInTheDocument();
  });

  it('transitions from intro to play after the starter taps', async () => {
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={vi.fn()} />,
    );

    await tap(screen, STARTER_TAPS);

    // The play-phase progress label appears, with nothing measured yet.
    await expect.element(screen.getByText('Cesto 0%')).toBeInTheDocument();
  });

  it('waits for the first contact before starting the clock', async () => {
    // The starter taps are not measurement: a child who hesitates must not have
    // that hesitation counted against the window.
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await tap(screen, STARTER_TAPS);
    await expect.element(screen.getByText(/il tempo parte da lì/)).toBeInTheDocument();

    await wait(1500); // well past the one-second window, but untouched
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('closes the window one target-second after the first contact', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await tap(screen, STARTER_TAPS);
    const el = await target(screen).element();

    press(el);
    await wait(1300); // hold right through the one-second window

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));

    const result = onComplete.mock.calls[0][0];
    // Scored against the whole window, and contact clipped to it.
    expect(result.sessionDurationMs).toBe(1000);
    expect(result.totalContactMs).toBeLessThanOrEqual(1000);
    expect(result.engagementRatio).toBeGreaterThan(90);
  });

  it('records how much of the window the child actually touched', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await tap(screen, STARTER_TAPS);
    const el = await target(screen).element();

    // Roughly half of the three-second window in contact, in two touches.
    press(el);
    await wait(750);
    release(el);
    await wait(750);
    press(el);
    await wait(750);
    release(el);

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 4000 });

    const result = onComplete.mock.calls[0][0];
    expect(result.sessionDurationMs).toBe(3000);
    expect(result.count).toBe(2);
    expect(result.engagementRatio).toBeGreaterThan(35);
    expect(result.engagementRatio).toBeLessThan(65);
    expect(result.latencyMs).not.toBeNull();
  });

  it('shows the hard-mode badge and beat hint on a difficile session', async () => {
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="difficile" onComplete={vi.fn()} />,
    );
    // Static, in the intro: the difficulty badge and the timing-mode instruction.
    await expect.element(screen.getByText('🎵 Difficile')).toBeInTheDocument();
    await expect.element(screen.getByText(/solo quando si illumina/)).toBeInTheDocument();
  });
});

/**
 * The hard-mode `hold` beat of levels 2 and 3: a lit window scores only when the
 * contact is held from its opening to its close. The beats are the game, not the
 * measurement — they feed the on-screen counter while the level is still closed
 * by its own window. Driven through raw pointer events (rather than a click)
 * because the press and the release must straddle the beat on their own schedule.
 */
describe('LevelPlay in hard mode on a hold level', () => {
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
    const { screen, el } = await playUntilLit(vi.fn());

    press(el);
    await wait(1200); // outlast the 1000 ms beat without releasing

    await expect.element(screen.getByText('🎵 1')).toBeInTheDocument();
  });

  it('does not score the beat when the contact is released too early', async () => {
    const { screen, el } = await playUntilLit(vi.fn());

    press(el);
    await wait(200); // let go well before the beat closes
    release(el);
    await wait(1200); // and let that beat close

    await expect.element(screen.getByText('🎵 0')).toBeInTheDocument();
  });
});
