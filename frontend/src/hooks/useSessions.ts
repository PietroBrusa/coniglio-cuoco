import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSession, fetchSessions } from '@/api/client';

export function useSessions(childId?: string) {
  return useQuery({
    //childId qui è solo la chiave di cache (evita di mostrare le sessioni del
    //bambino precedente durante un logout/login): i dati sono già filtrati dal
    //backend in base al token, fetchSessions() non riceve né usa questo id
    queryKey: ['sessions', childId ?? 'all'],
    //funzione che prende i dati
    queryFn: () => fetchSessions(),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    //prendo solo il primo pezzo della chiave, invalida le cache di tutti i bambini
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
