import { http } from "../http";
import type {
  CampaignCreateIn,
  CampaignImageOut,
  CampaignOut,
  CampaignPage,
  CampaignUpdateIn,
  CategoryCreateIn,
  CategoryOut,
  CategoryPage,
  CategoryUpdateIn,
  ContactOut,
  ContactPage,
  ContactStatus,
  DashboardSummaryOut,
  MessageOut,
  ProductCreateIn,
  ProductImageOut,
  ProductOut,
  ProductPage,
  ProductUpdateIn,
  UserAdminOut,
  UserAdminPage,
} from "../types";

function imageForm(file: File): FormData {
  const form = new FormData();
  form.append("image", file);
  return form;
}

export interface DashboardParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  topN?: number;
  lowStockThreshold?: number;
}

export const dashboardApi = {
  summary: (params: DashboardParams = {}, signal?: AbortSignal) =>
    http.get<DashboardSummaryOut>("/admin/dashboard/summary", {
      signal,
      query: {
        start_date: params.startDate,
        end_date: params.endDate,
        status: params.status,
        top_n: params.topN ?? 5,
        low_stock_threshold: params.lowStockThreshold ?? 5,
      },
    }),

  /** Baixa a planilha de pedidos (CSV ou Excel). */
  exportOrders: (params: { format: "csv" | "xlsx"; startDate?: string; endDate?: string; status?: string }) =>
    http.get<Blob>("/admin/dashboard/orders/export", {
      responseType: "blob",
      query: { format: params.format, start_date: params.startDate, end_date: params.endDate, status: params.status },
    }),
};

export const adminUsersApi = {
  list: (
    params: { page?: number; pageSize?: number; search?: string; role?: string; isActive?: boolean } = {},
    signal?: AbortSignal,
  ) =>
    http.get<UserAdminPage>("/admin/list-users", {
      signal,
      query: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        search: params.search,
        role: params.role,
        is_active: params.isActive,
      },
    }),
  deactivate: (userId: string) => http.post<unknown>(`/auth/deactive-user/${userId}`),
  reactivate: (userId: string) => http.post<unknown>(`/auth/reactivate-user/${userId}`),
};
export type { UserAdminOut };

export interface ProductCreateFullPayload {
  product_name: string;
  category_ids: string[];
  price: string;
  stock: number;
  description: string;
  shipping: { weight: string; height: string; width: string; length: string; quantity: number };
}

export interface AdminProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  activeOnly?: boolean;
  inStockOnly?: boolean;
}

export const adminProductsApi = {
  list: (params: AdminProductsParams = {}, signal?: AbortSignal) =>
    http.get<ProductPage>("/products/admin/list", {
      signal,
      query: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        search: params.search,
        product_category_id: params.categoryId,
        active_only: params.activeOnly ? true : undefined,
        in_stock_only: params.inStockOnly ? true : undefined,
      },
    }),
  get: (productId: string, signal?: AbortSignal) => http.get<ProductOut>(`/products/${productId}`, { signal }),
  create: (payload: ProductCreateIn) => http.post<ProductOut>("/products/", payload),

  /** Produto + dados de frete + imagens numa chamada só (multipart). `shipping` é obrigatório na API. */
  createFull: ({ data, images, coverIndex = 0 }: { data: ProductCreateFullPayload; images: File[]; coverIndex?: number }) => {
    const form = new FormData();
    form.append("payload", JSON.stringify(data));
    form.append("cover_index", String(coverIndex));
    images.forEach((file) => form.append("images", file));
    return http.post<ProductOut>("/products/full", form);
  },
  update: (productId: string, payload: ProductUpdateIn) => http.patch<ProductOut>(`/products/${productId}`, payload),
  remove: (productId: string) => http.delete<MessageOut>(`/products/${productId}`),
  activate: (productId: string) => http.post<ProductOut>(`/products/${productId}/activate`),
  deactivate: (productId: string) => http.post<ProductOut>(`/products/${productId}/deactivate`),
  setStock: (productId: string, stock: number) =>
    http.post<ProductOut>(`/products/${productId}/stock`, undefined, { query: { stock } }),

  images: (productId: string, signal?: AbortSignal) =>
    http.get<ProductImageOut[]>(`/products/${productId}/images`, { signal }),
  addImage: (productId: string, file: File, options: { isCover?: boolean } = {}) =>
    http.post<ProductImageOut>(`/products/${productId}/images`, imageForm(file), {
      query: { is_cover: options.isCover ? true : undefined },
    }),
  setCover: (imageId: string) => http.post<ProductImageOut>(`/products/images/${imageId}/set-cover`),
  removeImage: (imageId: string) => http.delete<MessageOut>(`/products/images/${imageId}`),
};

export const adminCategoriesApi = {
  list: (params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) =>
    http.get<CategoryPage>("/categories/", {
      signal,
      query: { page: params.page ?? 1, page_size: params.pageSize ?? 100, active_only: false },
    }),
  create: (payload: CategoryCreateIn) => http.post<CategoryOut>("/categories/", payload),
  update: (categoryId: string, payload: CategoryUpdateIn) => http.patch<CategoryOut>(`/categories/${categoryId}`, payload),
  remove: (categoryId: string) => http.delete<MessageOut>(`/categories/${categoryId}`),
  activate: (categoryId: string) => http.post<CategoryOut>(`/categories/${categoryId}/activate`),
  deactivate: (categoryId: string) => http.post<CategoryOut>(`/categories/${categoryId}/deactivate`),
  uploadImage: (categoryId: string, file: File) =>
    http.post<CategoryOut>(`/categories/${categoryId}/image`, imageForm(file)),
  removeImage: (categoryId: string) => http.delete<CategoryOut>(`/categories/${categoryId}/image`),
};

export const adminCampaignsApi = {
  list: (params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) =>
    http.get<CampaignPage>("/campaigns/", { signal, query: { page: params.page ?? 1, page_size: params.pageSize ?? 50 } }),
  create: (payload: CampaignCreateIn) => http.post<CampaignOut>("/campaigns/", payload),
  update: (campaignId: string, payload: CampaignUpdateIn) => http.patch<CampaignOut>(`/campaigns/${campaignId}`, payload),
  remove: (campaignId: string) => http.delete<MessageOut>(`/campaigns/${campaignId}`),
  activate: (campaignId: string) => http.post<CampaignOut>(`/campaigns/${campaignId}/activate`),
  deactivate: (campaignId: string) => http.post<CampaignOut>(`/campaigns/${campaignId}/deactivate`),
  images: (campaignId: string, signal?: AbortSignal) =>
    http.get<CampaignImageOut[]>(`/campaigns/${campaignId}/images`, { signal }),
  addImage: (campaignId: string, file: File, options: { isCover?: boolean } = {}) =>
    http.post<CampaignImageOut>(`/campaigns/${campaignId}/images`, imageForm(file), {
      query: { is_cover: options.isCover ? true : undefined },
    }),
  removeImage: (imageId: string) => http.delete<MessageOut>(`/campaigns/images/${imageId}`),
};

export const adminContactApi = {
  list: (params: { page?: number; pageSize?: number; status?: string; search?: string } = {}, signal?: AbortSignal) =>
    http.get<ContactPage>("/contact/", {
      signal,
      query: { page: params.page ?? 1, page_size: params.pageSize ?? 20, status: params.status, search: params.search },
    }),
  updateStatus: (contactId: string, status: ContactStatus) =>
    http.patch<ContactOut>(`/contact/${contactId}`, { status }),
  remove: (contactId: string) => http.delete<MessageOut>(`/contact/${contactId}`),
};