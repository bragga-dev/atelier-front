/** Fábrica central de query keys — evita strings soltas e facilita invalidação. */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (params: { page: number; pageSize: number; activeOnly: boolean }) =>
      ["categories", "list", params] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  notifications: {
    unreadCount: ["notifications", "unread-count"] as const,
  },
} as const;
