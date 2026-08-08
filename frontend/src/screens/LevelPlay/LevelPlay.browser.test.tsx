import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import LevelPlay from './LevelPlay';
import type { Food, Level } from '@/types';

const food: Food = { id: 'carota', label: 'Carota', emoji: '🥕' };

const quickLevel: Level = {
  id: 1,
  name: 'La Raccolta',
  behavior: 'Approccio e contatto con le dita',
  mode: 'hold',
  target: 1,
  hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap', beatTarget: 3 },
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
  hardBeat: { onMs: [1000, 1000], offMs: [1000, 1000], score: 'hold', beatTarget: 2 },
  intro: ({ foodLabel }) => `Annusa ${foodLabel}!`,
  hint: 'Tocca e mantieni con il naso',
  progressLabel: (done, target) => `Profumo ${Math.min(100, Math.round((done / target) * 100))}%`,
};

const STARTER_TAPS = 3;

// The Makey Makey is the only input: closing the circuit on the food sends
// Space, held down for as long as the child keeps the contact.
const press = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
const release = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Taps the starter sequence. The key listeners are attached in an effect, so a
 * tap fired in the same tick the level mounts can land before the level is
 * listening; re-checking the phase before every tap covers that without ever
 * tapping once play has begun (which would start the measurement window).
 */
async function startPlay(screen: Awaited<ReturnType<typeof render>>) {
  for (let i = 0; i < STARTER_TAPS + 5; i += 1) {
    if (!screen.getByText(/volte per iniziare/).query()) break;
    press();
    release();
    await wait(30);
  }
}

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

    await startPlay(screen);

    await expect.element(screen.getByText('Cesto 0%')).toBeInTheDocument();
  });

  it('waits for the first contact before starting the clock', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await startPlay(screen);
    await expect.element(screen.getByText(/il tempo parte da lì/)).toBeInTheDocument();

    await wait(1500);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('closes the window one target-second after the first contact', async () => {
    const onComplete = vi.fn();
    const screen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={onComplete} />,
    );

    await startPlay(screen);
    // The window opens on the first contact, not on entering the play phase:
    // wait for the "no contact yet" hint so the press below starts the clock.
    await expect.element(screen.getByText(/il tempo parte da lì/)).toBeInTheDocument();

    press();
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

    await startPlay(screen);
    // Same as above: the 3s window must start on the first press below, or the
    // measured contact only covers whatever is left of it.
    await expect.element(screen.getByText(/il tempo parte da lì/)).toBeInTheDocument();

    press();
    await wait(750);
    release();
    await wait(750);
    press();
    await wait(750);
    release();

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
    await startPlay(screen);
    await expect.element(screen.getByText('🎵 Tieni premuto!')).toBeInTheDocument();
    return screen;
  }

  it('explains that the wait and the hold change every time', async () => {
    const screen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="difficile" onComplete={vi.fn()} />,
    );
    await expect.element(screen.getByText(/l'attesa e la durata cambiano/)).toBeInTheDocument();
  });

  it('scores the beat when the contact is held until the window closes', async () => {
    const screen = await playUntilLit(vi.fn());

    press();
    await wait(1200);

    await expect.element(screen.getByText('🎵 Ritmo 1/2')).toBeInTheDocument();
  });

  it('does not score the beat when the contact is released too early', async () => {
    const screen = await playUntilLit(vi.fn());

    press();
    await wait(200);
    release();
    await wait(1200);

    await expect.element(screen.getByText('🎵 Ritmo 0/2')).toBeInTheDocument();
  });

  it('scores nothing when the contact is simply held from before the window opens', async () => {
    // È la scorciatoia da non premiare: il dito appoggiato attraversa le
    // finestre senza mai rispondere al ritmo, quindi la barra non deve muoversi.
    const screen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="difficile" onComplete={vi.fn()} />,
    );
    await startPlay(screen);

    press();
    await wait(2200);

    await expect.element(screen.getByText('🎵 Ritmo 0/2')).toBeInTheDocument();
    release();
  });

  it('hands the beats scored to onComplete, and null when the mode is not timed', async () => {
    const hard = vi.fn();
    const hardScreen = await render(
      <LevelPlay level={holdLevel} food={food} difficulty="difficile" onComplete={hard} />,
    );
    await startPlay(hardScreen);
    press();
    await vi.waitFor(() => expect(hard).toHaveBeenCalledTimes(1), { timeout: 5000 });
    release();
    expect(hard.mock.calls[0][1]).toBe(0);

    const easy = vi.fn();
    const easyScreen = await render(
      <LevelPlay level={quickLevel} food={food} difficulty="facile" onComplete={easy} />,
    );
    await startPlay(easyScreen);
    press();
    await vi.waitFor(() => expect(easy).toHaveBeenCalledTimes(1), { timeout: 4000 });
    release();
    expect(easy.mock.calls[0][1]).toBeNull();
  });
});
