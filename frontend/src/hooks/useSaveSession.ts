import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '@/api/client';
import type { Session } from '@/types';

export type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseSaveSessionOptions {
  alreadySaved?: boolean;
  onSaved?: () => void;
}

export interface UseSaveSessionResult {
  save: () => Promise<void>;
  status: SaveStatus;
  error: string;
}

export function useSaveSession(
  session: Session,
  options: UseSaveSessionOptions = {},
): UseSaveSessionResult {
  const { alreadySaved = false, onSaved } = options;
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({ mutationFn: saveSession });
  const [status, setStatus] = useState<SaveStatus>(alreadySaved ? 'success' : 'idle');
  const [error, setError] = useState('');

  //l'oggetto ref è creato una volta sola e non cambia mai
  const savedCallback = useRef(onSaved);
  //ad ogni render in cui onSaved cambia, aggiorniamo il contenuto 
  useEffect(() => {
    savedCallback.current = onSaved;
  }, [onSaved]);

  //save viene ricreata se session cambia 
  const save = useCallback(async () => {
    setStatus('pending');
    setError('');
    try {
      await mutateAsync(session);
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setStatus('success');
      //legge onSaved (la più recente anche se save è vecchio)
      savedCallback.current?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [mutateAsync, session, queryClient]);

  return { save, status, error };
}
