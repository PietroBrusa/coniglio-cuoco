import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '../api/client';
import type { Session } from '../types';

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

/** Options that let the caller own the "already saved" flag. */
export interface UseSaveSessionOptions {
  /**
   * `true` if this session has already been persisted. The auto-save on mount is
   * then skipped and the status starts at `success`. The caller must keep this
   * flag outside the component tree (game state), otherwise remounting the
   * summary screen — e.g. with the browser's back / forward buttons — would save
   * the same session a second time.
   */
  alreadySaved?: boolean;
  /** Called once the session has been persisted, so the caller can raise its flag. */
  onSaved?: () => void;
}

/**
 * Saves the session to the backend exactly once and exposes the current save
 * status. On success invalidates the `['sessions']` React Query cache and calls
 * `onSaved`. `save` can be called manually to retry after an error.
 * @param session - The completed game session to persist.
 * @param options - See {@link UseSaveSessionOptions}.
 * @returns `{ save, status, error }` — retry function, current status and last error message.
 */
export function useSaveSession(session: Session, options: UseSaveSessionOptions = {}) {
  const { alreadySaved = false, onSaved } = options;
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({ mutationFn: saveSession });
  const [status, setStatus] = useState<SaveStatus>(alreadySaved ? 'success' : 'idle');
  const [error, setError] = useState('');
  // Guards against the auto-save firing twice within a single mount (React
  // StrictMode); `alreadySaved` guards against it firing again on a new mount.
  const done = useRef(false);

  // Held in a ref so that `save` stays stable even though the caller usually
  // passes a fresh closure on every render.
  const savedCallback = useRef(onSaved);
  useEffect(() => {
    savedCallback.current = onSaved;
  }, [onSaved]);

  const save = useCallback(async () => {
    setStatus('pending');
    setError('');
    try {
      await mutateAsync(session);
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setStatus('success');
      savedCallback.current?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [mutateAsync, session, queryClient]);

  useEffect(() => {
    if (alreadySaved || done.current) return;
    done.current = true;
    void save();
  }, [alreadySaved, save]);

  return { save, status, error };
}
