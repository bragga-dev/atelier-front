import { http } from "../http";
import type { MessageOut, NotificationOut, NotificationPage, UnreadCountOut } from "../types";

export const notificationsApi = {
  unreadCount: (signal?: AbortSignal) => http.get<UnreadCountOut>("/notifications/unread-count", { signal }),

  list: (params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}, signal?: AbortSignal) =>
    http.get<NotificationPage>("/notifications/", {
      signal,
      query: { page: params.page ?? 1, page_size: params.pageSize ?? 20, unread_only: params.unreadOnly ? true : undefined },
    }),

  markRead: (id: string) => http.post<NotificationOut>(`/notifications/${id}/read`),
  markAllRead: () => http.post<{ updated: number }>("/notifications/read-all"),
  remove: (id: string) => http.delete<MessageOut>(`/notifications/${id}`),
};