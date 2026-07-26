import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveSession } from './useSaveSession';
import { sessionsApi } from '../api/apiClient';
import type { Session } from '../types';

const session = { childId: 'Frodo', sessionNumber: 1, levels: [] } as unknown as Session;

function wrapper() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('useSaveSession', () => {
  it('saves automatically on mount and reports success', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    const { result } = await renderHook(() => useSaveSession(session), { wrapper: wrapper() });

    await vi.waitFor(() => expect(result.current.status).toBe('success'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reports an error status when the save fails', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerCreate').mockRejectedValue(new Error('save failed'));

    const { result } = await renderHook(() => useSaveSession(session), { wrapper: wrapper() });

    await vi.waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('save failed');
  });

  it('calls onSaved once the session is persisted', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerCreate').mockResolvedValue({
      data: { _id: 'saved' },
    } as never);
    const onSaved = vi.fn();

    const { result } = await renderHook(() => useSaveSession(session, { onSaved }), {
      wrapper: wrapper(),
    });

    await vi.waitFor(() => expect(result.current.status).toBe('success'));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('does not save again when the session is already persisted', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockResolvedValue({ data: { _id: 'saved' } } as never);

    const { result } = await renderHook(
      () => useSaveSession(session, { alreadySaved: true }),
      { wrapper: wrapper() },
    );

    expect(result.current.status).toBe('success');
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it('can retry via save() after an initial failure', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerCreate')
      .mockRejectedValueOnce(new Error('first fails'))
      .mockResolvedValueOnce({ data: { _id: 'saved' } } as never);

    const { result } = await renderHook(() => useSaveSession(session), { wrapper: wrapper() });
    await vi.waitFor(() => expect(result.current.status).toBe('error'));

    await result.current.save();
    await vi.waitFor(() => expect(result.current.status).toBe('success'));
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
