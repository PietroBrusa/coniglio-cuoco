import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '../api/client';
import type { Session } from '../types';

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Automatically saves the session to the backend exactly once on mount and
 * exposes the current save status. On success invalidates the `['sessions']`
 * React Query cache. `save` can be called manually to retry after an error.
 * @param session - The completed game session to persist.
 * @returns `{ save, status, error }` — retry function, current status and last error message.
 */
export function useSaveSession(session: Session) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({ mutationFn: saveSession });
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const done = useRef(false);

  const save = useCallback(async () => {
    setStatus('pending');
    setError('');
    try {
      await mutateAsync(session);
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [mutateAsync, session, queryClient]);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void save();
  }, [save]);

  return { save, status, error };
}
