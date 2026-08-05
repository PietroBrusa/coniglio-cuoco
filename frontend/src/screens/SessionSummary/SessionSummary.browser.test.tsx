import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { render } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SessionSummary from './SessionSummary';
import { sessionsApi } from '@/api/apiClient';
import type { Session } from '@/types';

const session = {
  childId: 'John Doe',
  sessionNumber: 3,
  food: 'Carota',
  foodId: 'carota',
  difficulty: 'facile',
  therapist: 'Mary Major',
  problemBehaviors: [],
  notes: '',
  date: '2026-07-07T10:00:00.000Z',
  levels: [
    {
      levelId: 1,
      levelName: 'La Raccolta',
      behavior: 'Approccio e contatto con le dita',
      mode: 'hold',
      target: 6,
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
} as unknown as Session;

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const renderSummary = () =>
  render(<SessionSummary session={session} onNewSession={vi.fn()} />, { wrapper: Providers });

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('SessionSummary', () => {
  it('shows who ran the session', async () => {
    const page = await renderSummary();
    await expect.element(page.getByText('Mary Major')).toBeInTheDocument();
  });

  it('does not save before the therapist asks for it', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    await renderSummary();

    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends the selected problem behaviours and notes with the session', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    const page = await renderSummary();

    await page.getByText('Rifiuto del cibo').click();
    await page.getByText('Pianto o lamento').click();
    await page.getByPlaceholder('Osservazioni aggiuntive (facoltativo)').fill('  Molto stanco.  ');
    await page.getByRole('button', { name: /Salva sessione/ }).click();

    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toMatchObject({
      problemBehaviors: ['rifiuto-cibo', 'pianto'],
      notes: 'Molto stanco.',
      therapist: 'Mary Major',
    });
  });

  it('keeps "nessun comportamento problema" exclusive', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    const page = await renderSummary();

    await page.getByText('Rifiuto del cibo').click();
    await page.getByText('Nessun comportamento problema').click();
    await page.getByRole('button', { name: /Salva sessione/ }).click();

    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toMatchObject({ problemBehaviors: ['nessuno'] });
  });

  it('confirms the save and withdraws the save button', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerCreate').mockResolvedValue({
      data: { _id: 'saved' },
    } as never);

    const page = await renderSummary();
    await page.getByRole('button', { name: /Salva sessione/ }).click();

    await expect.element(page.getByText('✅ Sessione salvata nel database')).toBeInTheDocument();
    expect(page.getByRole('button', { name: /Salva sessione/ }).elements()).toHaveLength(0);
  });

  it('offers a retry when the save fails', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerCreate').mockRejectedValue(new Error('rete assente'));

    const page = await renderSummary();
    await page.getByRole('button', { name: /Salva sessione/ }).click();

    await expect.element(page.getByText(/Salvataggio non riuscito: rete assente/)).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: /Riprova salvataggio/ })).toBeInTheDocument();
  });
});
