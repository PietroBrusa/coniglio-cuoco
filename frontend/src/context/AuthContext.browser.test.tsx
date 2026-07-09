import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { AxiosError } from 'axios';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/apiClient';

/**
 * COMPONENT test for the authentication context (Vitest browser mode).
 *
 * The network boundary is the generated `authApi` client. Because module
 * mocking (vi.mock) is unavailable in browser mode, we spy on the client
 * instance methods instead — a clean seam that also exercises the real token
 * persistence and the error-message mapping.
 */

/** Builds an AxiosError carrying a backend-style error body. */
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
      data: { access_token: 'jwt.tok', name: 'Frodo' },
    } as never);

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await result.current.login('Frodo', 'shire123');

    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(true));
    expect(result.current.childId).toBe('Frodo');
    expect(localStorage.getItem('cc_token')).toBe('jwt.tok');
    expect(localStorage.getItem('cc_child')).toBe('Frodo');
  });

  it('registers through the register endpoint', async () => {
    const spy = vi.spyOn(authApi, 'authControllerRegister').mockResolvedValue({
      data: { access_token: 'jwt.tok', name: 'Sam' },
    } as never);

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await result.current.register('Sam', 'potatoes');

    expect(spy).toHaveBeenCalledWith({ name: 'Sam', password: 'potatoes' });
    await vi.waitFor(() => expect(result.current.childId).toBe('Sam'));
  });

  it('maps a backend string error message to the thrown Error', async () => {
    vi.spyOn(authApi, 'authControllerLogin').mockRejectedValue(
      axiosError('Invalid name or password'),
    );
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(result.current.login('Frodo', 'wrong')).rejects.toThrow(
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

  it('logs out and clears the stored token', async () => {
    vi.spyOn(authApi, 'authControllerLogin').mockResolvedValue({
      data: { access_token: 'jwt.tok', name: 'Frodo' },
    } as never);
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await result.current.login('Frodo', 'shire123');
    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(true));

    result.current.logout();
    await vi.waitFor(() => expect(result.current.isLoggedIn).toBe(false));
    expect(localStorage.getItem('cc_token')).toBeNull();
  });
});
