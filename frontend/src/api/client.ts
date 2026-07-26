import { AxiosError } from 'axios';
import type { Session } from '../types';
import { sessionsApi } from './apiClient';
import type { CreateSessionDto, SessionDto } from './generated';
import { clearAuth } from '../auth/tokenStore';

export type SavedSession = SessionDto;

export async function saveSession(session: Session): Promise<SavedSession> {
  try {
    const { data } = await sessionsApi.sessionsControllerCreate(session as unknown as CreateSessionDto);
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
  throw e instanceof Error ? e : new Error(String(e));
}
