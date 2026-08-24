import { AxiosError } from 'axios';
import type { Session } from '@/types';
import { authApi, sessionsApi } from './apiClient';
import type { SessionDto } from './generated';
import { clearAuth } from '@/storage/tokenStore';

export type SavedSession = SessionDto;

export interface AuthResult {
  token: string;
  childId: string;
}

export async function login(name: string, password: string): Promise<AuthResult> {
  return authenticate(() => authApi.authControllerLogin({ name, password }));
}

export async function register(name: string, password: string): Promise<AuthResult> {
  return authenticate(() => authApi.authControllerRegister({ name, password }));
}

async function authenticate(
  call: () => Promise<{ data: { access_token: string; name: string } }>,
): Promise<AuthResult> {
  try {
    const { data } = await call();
    return { token: data.access_token, childId: data.name };
  } catch (e) {
    throw new Error(messageFrom(e), { cause: e });
  }
}

export async function saveSession(session: Session): Promise<SavedSession> {
  try {
    const { data } = await sessionsApi.sessionsControllerCreate(session);
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function fetchSessions(): Promise<SavedSession[]> {
  try {
    const { data } = await sessionsApi.sessionsControllerFindAll();
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await sessionsApi.sessionsControllerRemove(id);
  } catch (e) {
    handleError(e);
  }
}

function handleError(e: unknown): never {
  if (e instanceof AxiosError && e.response?.status === 401) {
    clearAuth();
    throw new Error('Sessione scaduta: effettua di nuovo l’accesso');
  }
  throw new Error(messageFrom(e), { cause: e });
}

function messageFrom(e: unknown): string {
  if (e instanceof AxiosError) {
    const message = (e.response?.data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return e instanceof Error ? e.message : String(e);
}
