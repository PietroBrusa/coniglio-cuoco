import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/app/App';
import { AuthProvider } from '@/context/AuthContext';
import { GameProvider } from '@/context/GameContext';

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

// The Makey Makey is the only input: touching the food closes the circuit and
// sends Space, held down for as long as the contact lasts.
const press = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
const release = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Taps the starter sequence. The key listeners are attached in an effect, so a
 * tap fired in the same tick the level mounts can land before the level is
 * listening; re-checking the phase before every tap covers that without ever
 * tapping once play has begun (which would start the measurement window).
 */
async function enterPlay(screen: Screen, progressAtZero: string) {
  await expect.element(foodTarget(screen), { timeout: 5000 }).toBeInTheDocument();
  for (let i = 0; i < 8; i += 1) {
    if (screen.getByText(progressAtZero).query()) break;
    press();
    release();
    await wait(30);
  }
  await expect.element(screen.getByText(progressAtZero), { timeout: 5000 }).toBeInTheDocument();
}

async function holdUntilComplete(screen: Screen, rewardText: string, timeout: number) {
  press();
  try {
    await expect.element(screen.getByText(rewardText), { timeout }).toBeInTheDocument();
  } finally {
    release();
  }
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('cc_token', 'fake.jwt.token');
  localStorage.setItem('cc_child', 'John Doe');
  localStorage.setItem('coniglio-cuoco:therapist', 'Mary Major');
  localStorage.setItem('coniglio-cuoco:settings', JSON.stringify({ soundEnabled: false }));
});

afterEach(() => cleanup());

describe('Gameplay journey (E2E)', () => {
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
    await expect.element(screen.getByText(/Livello 2 · Sono buone\?/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 3 · L'Assaggio/)).toBeInTheDocument();
    await expect.element(screen.getByText('John Doe')).toBeInTheDocument();
  }, 45_000);

  it('plays a "difficile" session through without ever offering to record it', async () => {
    const screen = await renderApp('/setup');
    await screen.getByTitle('tocchi a tempo, solo gioco').click();
    await screen.getByRole('button', { name: /Inizia la storia/ }).click();

    // In difficile la barra conta le finestre centrate, non i secondi di
    // contatto: è l'etichetta stessa a dire su che cosa si è valutati.
    await enterPlay(screen, '🎵 Ritmo 0/3');
    await holdUntilComplete(screen, 'Livello 1 completato!', 12_000);
    // No measurements on the reward screen either: the run is play, not data.
    expect(screen.getByText('Riepilogo misurazioni').elements()).toHaveLength(0);
    // Tenere il contatto premuto attraversa le finestre senza centrarne nessuna.
    await expect.element(screen.getByText(/0 finestre centrate su 3/)).toBeInTheDocument();
    await expect.element(screen.getByLabelText(/[12] stelle su 3/)).toBeInTheDocument();
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    await enterPlay(screen, '🎵 Ritmo 0/2');
    await holdUntilComplete(screen, 'Livello 2 completato!', 12_000);
    await screen.getByRole('button', { name: /Prossimo livello/ }).click();

    await enterPlay(screen, '🎵 Ritmo 0/1');
    await holdUntilComplete(screen, 'Livello 3 completato!', 11_000);

    await screen.getByRole('button', { name: /Fine sessione/ }).click();

    await expect.element(screen.getByText('Partita completata')).toBeInTheDocument();
    await expect.element(screen.getByText(/senza raccolta dati/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salva sessione/ }).elements()).toHaveLength(0);
    expect(screen.getByText('Sessione completata').elements()).toHaveLength(0);
  }, 45_000);
});
