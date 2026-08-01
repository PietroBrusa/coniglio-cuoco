import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { render } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { unzipSync } from 'fflate';
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
  therapist: 'Mary Major',
  problemBehaviors: ['rifiuto-cibo', 'pianto'],
  notes: 'Bambino stanco a fine sessione.',
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

  it('shows therapist, problem behaviours and notes when a session is expanded', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession],
    } as never);

    const screen = await renderDashboard();
    await screen.getByRole('button', { name: /sessione 1 · Carota/ }).click();

    await expect.element(screen.getByText('Mary Major')).toBeInTheDocument();
    await expect.element(screen.getByText('🚫 Rifiuto del cibo')).toBeInTheDocument();
    await expect.element(screen.getByText('😢 Pianto o lamento')).toBeInTheDocument();
    await expect.element(screen.getByText('Bambino stanco a fine sessione.')).toBeInTheDocument();
  });

  it('marks legacy sessions saved before these fields existed', async () => {
    const legacy = { ...savedSession } as Record<string, unknown>;
    delete legacy.therapist;
    delete legacy.problemBehaviors;
    delete legacy.notes;
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [legacy],
    } as never);

    const screen = await renderDashboard();
    await screen.getByRole('button', { name: /sessione 1 · Carota/ }).click();

    await expect.element(screen.getByText('non registrato')).toBeInTheDocument();
    await expect.element(screen.getByText('nessuno registrato')).toBeInTheDocument();
  });

  it('downloads the ABA sheets, one per food, when exporting', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: [savedSession, otherFoodSession],
    } as never);

    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob);
      return 'blob:stub';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download);
    });

    const screen = await renderDashboard();
    await screen.getByRole('button', { name: /Esporta Excel/ }).click();

    expect(clicks).toEqual([expect.stringMatching(/^schede-aba_John-Doe_\d{4}-\d{2}-\d{2}\.xlsx$/)]);
    expect(blobs).toHaveLength(1);

    const bytes = new Uint8Array(await blobs[0].arrayBuffer());
    const files = unzipSync(bytes);
    expect(files['xl/charts/chart2.xml']).toBeDefined();
    expect(screen.container.textContent).not.toContain('Esportazione non riuscita');
  });

  it('cannot export when there is nothing to export', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({ data: [] } as never);

    const screen = await renderDashboard();
    await expect
      .element(screen.getByText('Nessuna sessione salvata per questo bambino.'))
      .toBeInTheDocument();

    await expect.element(screen.getByRole('button', { name: /Esporta Excel/ })).toBeDisabled();
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
