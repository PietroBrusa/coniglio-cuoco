import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '../api/client';
import type { Session } from '../types';

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseSaveSessionOptions {
  /**
   * `true` if this session has already been persisted; the auto-save on mount is
   * then skipped. The caller must keep this flag outside the component tree
   * (game state), otherwise remounting the summary screen — e.g. with the
   * browser's back / forward buttons — would save the session a second time.
   */
  alreadySaved?: boolean;
  onSaved?: () => void;
}

/**
 * Saves the session to the backend exactly once. `save` can be called manually
 * to retry after an error.
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
