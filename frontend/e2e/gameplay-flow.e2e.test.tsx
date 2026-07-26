import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

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

const foodTarget = (screen: Screen) => screen.getByRole('button', { name: /^Tocca / });

async function tapFood(screen: Screen, times = 1) {
  for (let i = 0; i < times; i += 1) await foodTarget(screen).click();
}

async function enterPlay(screen: Screen, progressAtZero: string) {
  await expect.element(foodTarget(screen), { timeout: 5000 }).toBeInTheDocument();
  await tapFood(screen, 3);
  await expect.element(screen.getByText(progressAtZero), { timeout: 5000 }).toBeInTheDocument();
}

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

afterEach(() => cleanup());

describe('Gameplay journey (E2E)', () => {
  it('plays the first (hold) level: setup → play → reward', async () => {
    const screen = await renderApp('/setup');
    await screen.getByRole('button', { name: /Inizia la storia/ }).click();

    await enterPlay(screen, 'Cesto 0%');
    await holdUntilComplete(screen, 'Livello 1 completato!', 12_000);
  }, 20_000);

  it('completes the full three-level session through to the summary', async () => {
    const screen = await renderApp('/setup');
    await screen.getByRole('button', { name: /Inizia la storia/ }).click();

    await enterPlay(screen, 'Cesto 0%');
    await holdUntilComplete(screen, 'Livello 1 completato!', 12_000);
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    await enterPlay(screen, 'Profumo 0%');
    await holdUntilComplete(screen, 'Livello 2 completato!', 12_000);
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    await enterPlay(screen, 'Assaggio 0%');
    await holdUntilComplete(screen, 'Livello 3 completato!', 11_000);

    await screen.getByRole('button', { name: /Fine sessione/ }).click();

    await expect.element(screen.getByText('Sessione completata')).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 1 · La Raccolta/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 2 · L'Annusata/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 3 · L'Assaggio/)).toBeInTheDocument();
    await expect.element(screen.getByText('Frodo')).toBeInTheDocument();
  }, 45_000);
});
