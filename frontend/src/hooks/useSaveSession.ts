import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '../api/client';
import type { Session } from '../types';

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseSaveSessionOptions {
  alreadySaved?: boolean;
  onSaved?: () => void;
}

export function useSaveSession(session: Session, options: UseSaveSessionOptions = {}) {
  const { alreadySaved = false, onSaved } = options;
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({ mutationFn: saveSession });
  const [status, setStatus] = useState<SaveStatus>(alreadySaved ? 'success' : 'idle');
  const [error, setError] = useState('');
  const done = useRef(false);

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
