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
    detail: (productId: string) => ["products", "detail", productId] as const,
  },
  reviews: {
    forProduct: (productId: string) => ["reviews", "product", productId] as const,
    summary: (productId: string) => ["reviews", "product", productId, "summary"] as const,
  },
  shipping: {
    quote: (productId: string, cep: string, quantity: number) =>
      ["shipping", "quote", productId, cep, quantity] as const,
  },
  campaigns: {
    running: ["campaigns", "running"] as const,
    images: (campaignId: string) => ["campaigns", "images", campaignId] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  address: {
    all: ["address"] as const,
  },
  orders: {
    all: ["orders"] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  payments: {
    forOrder: (orderId: string) => ["payments", "order", orderId] as const,
  },
  notifications: {
    unreadCount: ["notifications", "unread-count"] as const,
  },
} as const;