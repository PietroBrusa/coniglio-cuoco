import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from 'vitest-browser-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessions, useDeleteSession } from './useSessions';
import { sessionsApi } from '../api/apiClient';

/**
 * COMPONENT test for the React Query hooks that read/delete sessions.
 *
 * The network is stubbed at the generated `sessionsApi` seam. A fresh
 * QueryClient per test (retries disabled) keeps each case isolated and fast.
 */

function wrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('useSessions', () => {
  it('loads and returns the session list', async () => {
    const sessions = [{ _id: '1', sessionNumber: 1, food: 'Carota' }];
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: sessions,
    } as never);

    const { result } = await renderHook(() => useSessions('Frodo'), { wrapper: wrapper() });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sessions);
  });

  it('surfaces an error state when the request fails', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockRejectedValue(new Error('boom'));

    const { result } = await renderHook(() => useSessions('Frodo'), { wrapper: wrapper() });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteSession', () => {
  it('deletes by id and reports success', async () => {
    const spy = vi
      .spyOn(sessionsApi, 'sessionsControllerRemove')
      .mockResolvedValue({ data: { deleted: true, id: 'abc' } } as never);

    const { result } = await renderHook(() => useDeleteSession(), { wrapper: wrapper() });
    result.current.mutate('abc');

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith('abc');
  });
});
