import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import { fetchSessions, saveSession, deleteSession } from './client';
import { sessionsApi } from './apiClient';
import type { Session } from '../types';

function axios401(): AxiosError {
  const e = new AxiosError('Unauthorized');
  e.response = { status: 401, data: {} } as AxiosError['response'];
  return e;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('cc_token', 'expired.token');
  localStorage.setItem('cc_child', 'Frodo');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('client wrappers', () => {
  it('fetchSessions returns the backend data on success', async () => {
    const sessions = [{ _id: '1', childId: 'Frodo' }];
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockResolvedValue({
      data: sessions,
    } as never);

    await expect(fetchSessions()).resolves.toEqual(sessions);
  });

  it('saveSession returns the saved document on success', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerCreate').mockResolvedValue({
      data: { _id: 'abc' },
    } as never);

    await expect(saveSession({} as Session)).resolves.toEqual({ _id: 'abc' });
  });

  it('clears the stored auth and throws a friendly message on HTTP 401', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockRejectedValue(axios401());

    await expect(fetchSessions()).rejects.toThrow(/Sessione scaduta/);
    expect(localStorage.getItem('cc_token')).toBeNull();
    expect(localStorage.getItem('cc_child')).toBeNull();
  });

  it('passes non-401 errors through and keeps the auth intact', async () => {
    vi.spyOn(sessionsApi, 'sessionsControllerRemove').mockRejectedValue(
      new Error('Network down'),
    );

    await expect(deleteSession('abc')).rejects.toThrow('Network down');
    expect(localStorage.getItem('cc_token')).toBe('expired.token');
  });
});
