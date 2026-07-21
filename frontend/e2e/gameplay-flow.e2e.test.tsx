import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

/**
 * END-TO-END test (frontend) of the critical gameplay journey, in a real
 * Chromium browser. It mounts the WHOLE application (router, guards, contexts,
 * screens) and plays a full session the way a child would, by interacting with
 * the on-screen food target:
 *
 *   setup → play level 1 (hold) → reward → level 2 (hold) → reward →
 *   level 3 (hold) → reward → summary
 *
 * Nothing in the UI is mocked. The backend is not started here (the persistence
 * layer has its own Testcontainers E2E), so the summary's auto-save simply
 * reports its status; the journey and every screen transition are real. The e2e
 * project points the API at a dead port (see `vitest.config.ts`) so the save
 * always fails as a connection error, never as a 401 — which would log the app
 * out and take the summary off screen.
 */

type Screen = Awaited<ReturnType<typeof render>>;

function renderApp(initialPath: string) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <GameProvider>
            <App />
          </GameProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The food target button (label is food-agnostic: "Tocca <Food>"). */
const foodTarget = (screen: Screen) => screen.getByRole('button', { name: /^Tocca / });

/** A quick tap on the food (pointer down + up via a real click). */
async function tapFood(screen: Screen, times = 1) {
  for (let i = 0; i < times; i += 1) await foodTarget(screen).click();
}

/**
 * Clears the intro (3 starter taps) and waits for the play phase to be active,
 * asserted via the level's progress label at 0.
 */
async function enterPlay(screen: Screen, progressAtZero: string) {
  await expect.element(foodTarget(screen), { timeout: 5000 }).toBeInTheDocument();
  await tapFood(screen, 3);
  await expect.element(screen.getByText(progressAtZero), { timeout: 5000 }).toBeInTheDocument();
}

/**
 * Presses and holds the food (pointer down), waits for the level to complete
 * (its reward heading), then releases. Used for the "hold" levels.
 */
async function holdUntilComplete(screen: Screen, rewardText: string, timeout: number) {
  const el = foodTarget(screen).element();
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  try {
    await expect.element(screen.getByText(rewardText), { timeout }).toBeInTheDocument();
  } finally {
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  }
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('cc_token', 'fake.jwt.token');
  localStorage.setItem('cc_child', 'Frodo');
  localStorage.setItem('coniglio-cuoco:settings', JSON.stringify({ soundEnabled: false }));
});

// Unmount the previous app between tests so its state/DOM don't leak.
afterEach(() => cleanup());

describe('Gameplay journey (E2E)', () => {
  it('plays the first (hold) level: setup → play → reward', async () => {
    const screen = await renderApp('/setup');
    await screen.getByRole('button', { name: /Inizia la storia/ }).click();

    await enterPlay(screen, 'Cesto 0%'); // level 1: hold, target 6s
    await holdUntilComplete(screen, 'Livello 1 completato!', 12_000);
  }, 20_000);

  it('completes the full three-level session through to the summary', async () => {
    const screen = await renderApp('/setup');
    await screen.getByRole('button', { name: /Inizia la storia/ }).click();

    // ---- Level 1: hold mode (target 6s) ----
    await enterPlay(screen, 'Cesto 0%');
    await holdUntilComplete(screen, 'Livello 1 completato!', 12_000);
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    // ---- Level 2: hold mode (target 6s) ----
    await enterPlay(screen, 'Profumo 0%');
    await holdUntilComplete(screen, 'Livello 2 completato!', 12_000);
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    // ---- Level 3: hold mode (target 5s) ----
    await enterPlay(screen, 'Assaggio 0%');
    await holdUntilComplete(screen, 'Livello 3 completato!', 11_000);

    // Last level → the reward advances to the summary.
    await screen.getByRole('button', { name: /Fine sessione/ }).click();

    // ---- Summary: the completed session is shown with all three levels ----
    await expect.element(screen.getByText('Sessione completata')).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 1 · La Raccolta/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 2 · L'Annusata/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 3 · L'Assaggio/)).toBeInTheDocument();
    await expect.element(screen.getByText('Frodo')).toBeInTheDocument();
  }, 45_000);
});
