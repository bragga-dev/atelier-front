import { http } from "../http";
import type { UnreadCountOut } from "../types";

export const notificationsApi = {
  unreadCount: (signal?: AbortSignal) =>
    http.get<UnreadCountOut>("/notifications/unread-count", { signal }),
};
