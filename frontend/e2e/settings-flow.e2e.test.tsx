import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

/**
 * END-TO-END test (frontend) — runs in a real Chromium browser.
 *
 * Unlike the component tests, nothing here is rendered in isolation: we mount
 * the WHOLE application (real router, real auth guard, real screens, real
 * providers) exactly as `main.tsx` does, and drive a complete therapist
 * journey through the UI:
 *
 *   1. an authenticated user lands on the protected /settings route
 *      (the real ProtectedRoute guard must let them through);
 *   2. they change a star-rating threshold and save it;
 *   3. the value is persisted (localStorage), as the app itself would store it;
 *   4. navigating "back" leaves the settings screen.
 *
 * Authentication is seeded programmatically (a standard E2E technique) so the
 * flow does not depend on the backend being up — the auth state is read from
 * localStorage exactly as the real app reads it.
 */

const SETTINGS_KEY = 'coniglio-cuoco:settings';

/** Mounts the real app at a given route, inside the same providers as main.tsx. */
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
  // Seed an authenticated session (as a successful login would).
  localStorage.setItem('cc_token', 'fake.jwt.token');
  localStorage.setItem('cc_child', 'Frodo');
});

describe('Settings user journey (E2E)', () => {
  it('lets an authenticated user open, change and persist the settings', async () => {
    const screen = await renderApp('/settings');

    // 1. The guard let us reach the protected settings screen.
    await expect.element(screen.getByRole('heading', { name: 'Impostazioni' })).toBeInTheDocument();

    // 2. Change the "prompt approach" threshold (shown in seconds) to 1.5s.
    const promptInput = screen.getByRole('spinbutton').first();
    await promptInput.fill('1.5');

    // 3. Save and see the confirmation.
    await screen.getByRole('button', { name: 'Salva' }).click();
    await expect.element(screen.getByText('Impostazioni salvate ✓')).toBeInTheDocument();

    // 4. The value is persisted the way the app stores it (ms, in localStorage).
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    expect(stored.promptLatencyMs).toBe(1500);
  });

  it('redirects an unauthenticated user away from the protected route', async () => {
    localStorage.removeItem('cc_child'); // log out
    const screen = await renderApp('/settings');

    // The guard redirects to /login: the login screen is shown instead, and
    // the settings heading must NOT appear.
    await expect.element(screen.getByRole('button', { name: /Accedi/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impostazioni' }).elements()).toHaveLength(0);
  });

  it('navigates away from settings when pressing back', async () => {
    const screen = await renderApp('/settings');
    await expect.element(screen.getByRole('heading', { name: 'Impostazioni' })).toBeInTheDocument();

    await screen.getByRole('button', { name: /Torna indietro/ }).click();

    // Navigation lands on the setup screen (its heading appears), which also
    // means the settings screen has been left behind.
    await expect
      .element(screen.getByRole('heading', { name: 'La Fattoria del Coniglio Cuoco' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impostazioni' }).elements()).toHaveLength(0);
  });
});
