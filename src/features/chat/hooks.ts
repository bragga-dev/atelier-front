// frontend/src/features/chat/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/endpoints/chat";
import { queryKeys } from "@/api/query-keys";

export function useMyConversations() {
  return useQuery({
    queryKey: queryKeys.chat.mine,
    queryFn: ({ signal }) => chatApi.mine(signal),
    staleTime: 15_000,
  });
}

export function useAdminInbox(status?: string) {
  return useQuery({
    queryKey: queryKeys.chat.inbox(status),
    queryFn: ({ signal }) => chatApi.adminInbox(status, signal),
    refetchInterval: 20_000, // o inbox não tem push: polling leve
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId?: string) => chatApi.start(orderId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.chat.all }),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: ({ signal }) => chatApi.messages(conversationId, signal),
    staleTime: Infinity, // o WebSocket mantém a lista atual
  });
}