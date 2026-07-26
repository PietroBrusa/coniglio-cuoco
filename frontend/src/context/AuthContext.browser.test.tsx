import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { AxiosError } from 'axios';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi, sessionsApi } from '../api/apiClient';
import { fetchSessions } from '../api/client';
import { setAuth } from '../auth/tokenStore';

function axiosError(message: string | string[]): AxiosError {
  const e = new AxiosError('Request failed');
  e.response = { data: { message } } as AxiosError['response'];
  return e;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthContext', () => {
  it('starts logged out', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.childId).toBeNull();
  });

  it('logs in: stores the token and exposes the child', async () => {
    vi.spyOn(authApi, 'authControllerLogin').mockResolvedValue({
      data: { access_token: 'jwt.tok', name: 'John Doe' },
    } as never);

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await result.current.login('John Doe', 'password123');

    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(true));
    expect(result.current.childId).toBe('John Doe');
    expect(localStorage.getItem('cc_token')).toBe('jwt.tok');
    expect(localStorage.getItem('cc_child')).toBe('John Doe');
  });

  it('registers through the register endpoint', async () => {
    const spy = vi.spyOn(authApi, 'authControllerRegister').mockResolvedValue({
      data: { access_token: 'jwt.tok', name: 'Jane Doe' },
    } as never);

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await result.current.register('Jane Doe', 'pass7890');

    expect(spy).toHaveBeenCalledWith({ name: 'Jane Doe', password: 'pass7890' });
    await vi.waitFor(() => expect(result.current.childId).toBe('Jane Doe'));
  });

  it('maps a backend string error message to the thrown Error', async () => {
    vi.spyOn(authApi, 'authControllerLogin').mockRejectedValue(
      axiosError('Invalid name or password'),
    );
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(result.current.login('John Doe', 'wrong')).rejects.toThrow(
      'Invalid name or password',
    );
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('joins an array of validation messages into one string', async () => {
    vi.spyOn(authApi, 'authControllerRegister').mockRejectedValue(
      axiosError(['name too short', 'password too short']),
    );
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(result.current.register('x', '1')).rejects.toThrow(
      'name too short, password too short',
    );
  });

  it('logs the user out when a request comes back 401 (expired token)', async () => {
    const expired = new AxiosError('Unauthorized');
    expired.response = { status: 401, data: {} } as AxiosError['response'];
    vi.spyOn(sessionsApi, 'sessionsControllerFindAll').mockRejectedValue(expired);

    setAuth('jwt.tok', 'John Doe');
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.isLoggedIn).toBe(true);

    await expect(fetchSessions()).rejects.toThrow(/Sessione scaduta/);

    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(false));
    expect(result.current.childId).toBeNull();
    expect(localStorage.getItem('cc_token')).toBeNull();
  });

  it('starts logged out when the stored token has already expired', async () => {
    const exp = Math.floor((Date.now() - 60_000) / 1000);
    const payload = btoa(JSON.stringify({ sub: 'John Doe', exp }));
    setAuth(`header.${payload}.signature`, 'John Doe');

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem('cc_token')).toBeNull();
  });

  it('logs out and clears the stored token', async () => {
    vi.spyOn(authApi, 'authControllerLogin').mockResolvedValue({
      data: { access_token: 'jwt.tok', name: 'John Doe' },
    } as never);
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await result.current.login('John Doe', 'password123');
    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(true));

    result.current.logout();
    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(false));
    expect(localStorage.getItem('cc_token')).toBeNull();
  });
});
