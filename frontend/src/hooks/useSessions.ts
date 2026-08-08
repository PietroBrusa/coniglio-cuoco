/**
 * Lettura e cancellazione delle sessioni salvate.
 *
 * @module
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSession, fetchSessions } from '@/api/client';

/**
 * Carica le sessioni del bambino autenticato, tenendole in cache condivisa fra
 * le schermate: setup e dashboard leggono gli stessi dati senza chiederli due
 * volte al server.
 *
 * @param childId - Bambino di cui si stanno guardando le sessioni. Non viene
 * inviato al server, che filtra comunque in base al token: serve solo a tenere
 * separate le cache quando si cambia bambino.
 * @returns Il risultato della query, con dati, stato di caricamento ed errore.
 */
export function useSessions(childId?: string) {
  return useQuery({
    queryKey: ['sessions', childId ?? 'all'],
    queryFn: () => fetchSessions(),
  });
}

/**
 * Cancella una sessione e aggiorna la lista.
 *
 * @returns La mutazione di React Query; a cancellazione riuscita la cache delle
 * sessioni viene invalidata e la dashboard si aggiorna da sola.
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
