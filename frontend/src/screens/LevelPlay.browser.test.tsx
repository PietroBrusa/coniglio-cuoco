import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import LevelPlay from './LevelPlay';
import type { Food, Level } from '../types';

const food: Food = { id: 'carota', label: 'Carota', emoji: '🥕' };

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

const target = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole('button', { name: /Tocca Carota/ });

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

    await expect.element(screen.getByText('Cesto 0%')).toBeInTheDocument();
  });

  it('waits for the first contact before starting the clock', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await tap(screen, STARTER_TAPS);
    await expect.element(screen.getByText(/il tempo parte da lì/)).toBeInTheDocument();

    await wait(1500);
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
    await wait(1300);

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));

    const result = onComplete.mock.calls[0][0];
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
    await expect.element(screen.getByText('🎵 Difficile')).toBeInTheDocument();
    await expect.element(screen.getByText(/solo quando si illumina/)).toBeInTheDocument();
  });
});

describe('LevelPlay in hard mode on a hold level', () => {
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
    await wait(1200);

    await expect.element(screen.getByText('🎵 1')).toBeInTheDocument();
  });

  it('does not score the beat when the contact is released too early', async () => {
    const { screen, el } = await playUntilLit(vi.fn());

    press(el);
    await wait(200);
    release(el);
    await wait(1200);

    await expect.element(screen.getByText('🎵 0')).toBeInTheDocument();
  });
});
