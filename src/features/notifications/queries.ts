import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints/notifications";
import { queryKeys } from "@/api/query-keys";
import { useAuth } from "@/features/auth/auth-context";

const POLL_INTERVAL_MS = 60_000;

/**
 * Contador do sino. O backend não tem push para notificações (o WebSocket existe só
 * para o chat), então fazemos polling leve — pausado com a aba em segundo plano.
 */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    enabled: isAuthenticated,
    select: (data) => data.unread_count,
    staleTime: 30_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
