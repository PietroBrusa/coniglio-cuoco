import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSession, fetchSessions } from '../api/client';

/**
 * React Query hook that fetches and caches the session list.
 * The `childId` is used as part of the cache key; child scoping is enforced
 * server-side via the JWT.
 * @param childId - Optional child identifier used to namespace the cache entry.
 * @returns Standard React Query result object (`data`, `isLoading`, `isError`, …).
 */
export function useSessions(childId?: string) {
  return useQuery({
    queryKey: ['sessions', childId ?? 'all'],
    queryFn: () => fetchSessions(),
  });
}

/**
 * React Query mutation hook that deletes a session by id and refreshes the list.
 * @returns Standard React Query mutation object; call `.mutate(id)` to trigger deletion.
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
