/**
 * Salvataggio della sessione conclusa.
 *
 * @module
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSession } from '@/api/client';
import type { Session } from '@/types';

/** Stato del salvataggio, mostrato in chiaro nella schermata di riepilogo. */
export type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

/** Opzioni del salvataggio. */
export interface UseSaveSessionOptions {
  /**
   * La sessione è già stata scritta nel database: l'hook parte in stato di
   * successo e il pulsante di salvataggio non ricompare. È la protezione contro
   * il salvataggio doppio quando si torna sulla schermata di riepilogo.
   */
  alreadySaved?: boolean;
  /** Richiamata a salvataggio riuscito, per segnare la sessione come salvata. */
  onSaved?: () => void;
}

/** Ciò che l'hook restituisce alla schermata di riepilogo. */
export interface UseSaveSessionResult {
  /** Avvia il salvataggio; non solleva eccezioni, riporta l'esito nello stato. */
  save: () => Promise<void>;
  /** Stato corrente del salvataggio. */
  status: SaveStatus;
  /** Messaggio d'errore dell'ultimo tentativo fallito, stringa vuota altrimenti. */
  error: string;
}

/**
 * Salva la sessione su richiesta.
 *
 * La scrittura non è volutamente automatica: prima il terapista etichetta i
 * comportamenti problema osservati e scrive le note, così il record arriva nel
 * database completo con una sola richiesta e non restano documenti parziali.
 *
 * A salvataggio riuscito la cache delle sessioni viene invalidata, e la
 * dashboard mostra la sessione nuova senza bisogno di ricaricare.
 *
 * @param session - Sessione da salvare, già annotata.
 * @param options - Stato iniziale e richiamata di conferma.
 * @returns La funzione `save`, lo stato corrente e l'eventuale messaggio d'errore.
 */
export function useSaveSession(
  session: Session,
  options: UseSaveSessionOptions = {},
): UseSaveSessionResult {
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
