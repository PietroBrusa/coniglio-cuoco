import { AxiosError } from 'axios';
import type { Session } from '../types';
import { sessionsApi } from './apiClient';
import type { CreateSessionDto, SessionDto } from './generated';
import { clearAuth } from '../auth/tokenStore';

/**
 * Thin wrappers over the generated sessions API client.
 * Expose plain async functions (consumed by React Query hooks) and centralise
 * 401 handling so that token expiry is always caught in one place.
 */

/** A session document as returned by the backend after save or fetch. */
export type SavedSession = SessionDto;

/**
 * Saves a session to the backend: `POST /sessions`.
 * @param session - The completed game session to persist.
 * @returns The saved session document as returned by the backend.
 * @throws {Error} Human-readable message; clears stored auth on HTTP 401.
 */
export async function saveSession(session: Session): Promise<SavedSession> {
  try {
    const { data } = await sessionsApi.sessionsControllerCreate(session as unknown as CreateSessionDto);
    return data;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Fetches all sessions for the authenticated child: `GET /sessions`.
 * Child scoping is enforced by the backend via the JWT — no `childId` param needed.
 * @returns Array of saved sessions in descending date order.
 * @throws {Error} Human-readable message; clears stored auth on HTTP 401.
 */
export async function fetchSessions(): Promise<SavedSession[]> {
  try {
    const { data } = await sessionsApi.sessionsControllerFindAll();
    return data;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Deletes a session by id: `DELETE /sessions/:id`.
 * @param id - MongoDB ObjectId string of the session to delete.
 * @throws {Error} Human-readable message; clears stored auth on HTTP 401.
 */
export async function deleteSession(id: string): Promise<void> {
  try {
    await sessionsApi.sessionsControllerRemove(id);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Translates Axios errors into plain `Error` objects; logs out on HTTP 401.
 * @param e - Any caught value.
 * @throws {Error} Always — return type is `never`.
 */
function handleError(e: unknown): never {
  if (e instanceof AxiosError && e.response?.status === 401) {
    clearAuth();
    throw new Error('Sessione scaduta: effettua di nuovo l’accesso');
  }
  throw e instanceof Error ? e : new Error(String(e));
}
