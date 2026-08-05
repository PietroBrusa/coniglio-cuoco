import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/app/App';
import { AuthProvider } from '@/context/AuthContext';
import { GameProvider } from '@/context/GameContext';

const SETTINGS_KEY = 'coniglio-cuoco:settings';

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

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('cc_token', 'fake.jwt.token');
  localStorage.setItem('cc_child', 'John Doe');
});

describe('Settings user journey (E2E)', () => {
  it('lets an authenticated user open, change and persist the settings', async () => {
    const screen = await renderApp('/settings');

    await expect.element(screen.getByRole('heading', { name: 'Impostazioni' })).toBeInTheDocument();

    const promptInput = screen.getByRole('spinbutton').first();
    await promptInput.fill('1.5');

    await screen.getByRole('button', { name: 'Salva' }).click();
    await expect.element(screen.getByText('Impostazioni salvate ✓')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    expect(stored.promptLatencyMs).toBe(1500);
  });

  it('redirects an unauthenticated user away from the protected route', async () => {
    localStorage.removeItem('cc_child');
    const screen = await renderApp('/settings');

    await expect.element(screen.getByRole('button', { name: /Accedi/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impostazioni' }).elements()).toHaveLength(0);
  });

  it('navigates away from settings when pressing back', async () => {
    const screen = await renderApp('/settings');
    await expect.element(screen.getByRole('heading', { name: 'Impostazioni' })).toBeInTheDocument();

    await screen.getByRole('button', { name: /Torna indietro/ }).click();

    await expect
      .element(screen.getByRole('heading', { name: 'La Fattoria del Coniglio Cuoco' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impostazioni' }).elements()).toHaveLength(0);
  });
});
