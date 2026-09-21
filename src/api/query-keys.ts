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
  products: {
    all: ["products"] as const,
    list: (params: object) => ["products", "list", params] as const,
  },
  campaigns: {
    running: ["campaigns", "running"] as const,
    images: (campaignId: string) => ["campaigns", "images", campaignId] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  notifications: {
    unreadCount: ["notifications", "unread-count"] as const,
  },
} as const;