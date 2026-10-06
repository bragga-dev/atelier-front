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
  orders: {
    all: ["orders"] as const,
    list: ["orders", "list"] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
    payments: (orderId: string) => ["orders", "detail", orderId, "payments"] as const,
  },
  addresses: {
    list: ["addresses", "list"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
    list: (params: object) => ["notifications", "list", params] as const,
  },
  account: {
    sessions: ["account", "sessions"] as const,
  },
  myReviews: ["reviews", "mine"] as const,
  chat: {
    all: ["chat"] as const,
    mine: ["chat", "mine"] as const,
    inbox: (status?: string) => ["chat", "inbox", status ?? "all"] as const,
    conversation: (id: string) => ["chat", "conversation", id] as const,
    messages: (id: string) => ["chat", "messages", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    dashboard: (params: object) => ["admin", "dashboard", params] as const,
    orders: (params: object) => ["admin", "orders", params] as const,
    order: (id: string) => ["admin", "orders", "detail", id] as const,
    products: (params: object) => ["admin", "products", params] as const,
    product: (id: string) => ["admin", "products", "detail", id] as const,
    categories: ["admin", "categories"] as const,
    campaigns: ["admin", "campaigns"] as const,
    campaignImages: (id: string) => ["admin", "campaigns", id, "images"] as const,
    contacts: (params: object) => ["admin", "contacts", params] as const,
    users: (params: object) => ["admin", "users", params] as const,
    reviewsPending: ["admin", "reviews", "pending"] as const,
    reviewsAuthorized: ["admin", "reviews", "authorized"] as const,
  },
} as const;