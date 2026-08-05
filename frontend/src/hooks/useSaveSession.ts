import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '@/api/client';
import type { Session } from '@/types';

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseSaveSessionOptions {
  alreadySaved?: boolean;
  onSaved?: () => void;
}

/**
 * Saves a session on demand. The write is deliberately not automatic: the
 * therapist first tags the problem behaviours observed, so the record reaches
 * the database complete in a single POST.
 */
export function useSaveSession(session: Session, options: UseSaveSessionOptions = {}) {
  const { alreadySaved = false, onSaved } = options;
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({ mutationFn: saveSession });
  const [status, setStatus] = useState<SaveStatus>(alreadySaved ? 'success' : 'idle');
  const [error, setError] = useState('');

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

  return { save, status, error };
}
