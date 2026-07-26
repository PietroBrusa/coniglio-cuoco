import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { render } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import { sessionsApi } from '../api/apiClient';
import type { SavedSession } from '../api/client';

const savedSession = {
  _id: 's1',
  childId: 'John Doe',
  sessionNumber: 1,
  food: 'Carota',
  foodId: 'carota',
  difficulty: 'facile',
  date: '2026-07-07T10:00:00.000Z',
  createdAt: '2026-07-07T10:00:00.000Z',
  levels: [
    {
      levelId: 1,
      levelName: 'La Raccolta',
      behavior: 'Approccio e contatto con le dita',
      mode: 'count',
      target: 5,
      metrics: {
        n: 3,
        latencyMs: 800,
        totalContactMs: 1200,
        meanTouchMs: 400,
        meanIrtMs: 250,
        sessionDurationMs: 5000,
        engagementRatio: 24,
        touches: [],
      },
    },
  ],
} as unknown as SavedSession;

const otherFoodSession = {
  ...savedSession,
  _id: 's2',
  sessionNumber: 2,
  food: 'Mela',
  foodId: 'mela',
  date: '2026-07-08T10:00:00.000Z',
} as unknown as SavedSession;

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const renderDashboard = () =>
  render(<Dashboard childId="John Doe" onBack={vi.fn()} />, { wrapper: Providers });

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('Dashboard', () => {
  it('renders the fetched sessions', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession],
    } as never);

    const screen = await renderDashboard();
    await expect.element(screen.getByText(/sessione 1 · Carota/)).toBeInTheDocument();
  });

  it('keeps each food on its own page, switched by the tabs', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession, otherFoodSession],
    } as never);

    const screen = await renderDashboard();

    await expect.element(screen.getByText(/sessione 1 · Carota/)).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain('sessione 1 · Mela');

    await screen.getByRole('tab', { name: /Mela/ }).click();

    await expect.element(screen.getByText(/sessione 1 · Mela/)).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain('sessione 1 · Carota');
  });

  it("numbers each food's sessions from one", async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession, otherFoodSession],
    } as never);

    const screen = await renderDashboard();
    await screen.getByRole('tab', { name: /Mela/ }).click();

    await expect.element(screen.getByText(/sessione 1 · Mela/)).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain('in assoluto');
  });

  it('shows no tabs when every session used the same food', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession],
    } as never);

    const screen = await renderDashboard();
    await expect.element(screen.getByText(/sessione 1 · Carota/)).toBeInTheDocument();

    expect(screen.container.querySelectorAll('[role="tab"]')).toHaveLength(0);
  });

  it('shows the empty state when there are no sessions', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({ data: [] } as never);

    const screen = await renderDashboard();
    await expect
      .element(screen.getByText('Nessuna sessione salvata per questo bambino.'))
      .toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockRejectedValue(new Error('offline'));

    const screen = await renderDashboard();
    await expect.element(screen.getByText(/Impossibile caricare le sessioni/)).toBeInTheDocument();
  });

  it('deletes a session after confirmation', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession],
    } as never);
    const removeSpy = vi
      .spyOn(sessionsApi, 'sessionsControllerRemove')
      .mockResolvedValue({ data: { deleted: true, id: 's1' } } as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const screen = await renderDashboard();
    await screen.getByRole('button', { name: /sessione 1 · Carota/ }).click();
    await screen.getByRole('button', { name: /Elimina/ }).click();

    await vi.waitFor(() => expect(removeSpy).toHaveBeenCalledWith('s1'));
  });
});
