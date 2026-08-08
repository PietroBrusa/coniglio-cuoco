import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-react';
import PracticeSummary from './PracticeSummary';
import { sessionsApi } from '@/api/apiClient';

afterEach(() => vi.restoreAllMocks());

describe('PracticeSummary', () => {
  it('closes the game without offering to save anything', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    const screen = await render(<PracticeSummary onNewSession={vi.fn()} />);

    await expect.element(screen.getByText('Partita completata')).toBeInTheDocument();
    await expect.element(screen.getByText(/senza raccolta dati/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salva sessione/ }).elements()).toHaveLength(0);

    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it('starts a new session on request', async () => {
    const onNewSession = vi.fn();
    const screen = await render(<PracticeSummary onNewSession={onNewSession} />);

    await screen.getByRole('button', { name: /Nuova sessione/ }).click();
    expect(onNewSession).toHaveBeenCalledTimes(1);
  });
});
