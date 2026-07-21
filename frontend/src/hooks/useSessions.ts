import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSession, fetchSessions } from '../api/client';

/** `childId` only namespaces the cache; scoping is enforced server-side. */
export function useSessions(childId?: string) {
  return useQuery({
    queryKey: ['sessions', childId ?? 'all'],
    queryFn: () => fetchSessions(),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
