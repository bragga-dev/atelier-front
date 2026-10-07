// frontend/src/features/admin/hooks.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCampaignsApi, adminCategoriesApi, adminContactApi, adminProductsApi, adminUsersApi, dashboardApi, type AdminProductsParams, type DashboardParams } from "@/api/endpoints/admin";
import { ordersApi } from "@/api/endpoints/orders";
import { reviewsApi } from "@/api/endpoints/reviews";
import { toUserMessage } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import type { CampaignCreateIn, CampaignUpdateIn, CategoryCreateIn, CategoryUpdateIn, ContactStatus, ProductUpdateIn } from "@/api/types";
import { toast } from "@/lib/toast";

const K = queryKeys.admin;

// ── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboard(params: DashboardParams) {
  return useQuery({ queryKey: K.dashboard(params), queryFn: ({ signal }) => dashboardApi.summary(params, signal) });
}

// ── Pedidos ──────────────────────────────────────────────────────────────────
export function useAdminOrders(params: { status?: string; search?: string; page: number }) {
  return useQuery({
    queryKey: K.orders(params),
    queryFn: ({ signal }) => ordersApi.adminList(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({ queryKey: K.order(orderId), queryFn: ({ signal }) => ordersApi.adminGet(orderId, signal) });
}

export function useGenerateLabel(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.generateLabel(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: K.all });
      toast.success("Etiqueta gerada.");
    },
    // A mensagem da Frenet (saldo, dados faltando…) é mostrada no diálogo.
    meta: { errorToast: false },
  });
}

// ── Produtos ─────────────────────────────────────────────────────────────────
export function useAdminProducts(params: AdminProductsParams) {
  return useQuery({
    queryKey: K.products(params),
    queryFn: ({ signal }) => adminProductsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(productId: string | undefined) {
  return useQuery({
    queryKey: K.product(productId ?? ""),
    queryFn: ({ signal }) => adminProductsApi.get(productId!, signal),
    enabled: Boolean(productId),
  });
}

function useProductsInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...K.all, "products"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all }); // vitrine pública
  };
}

export function useProductActions() {
  const invalidate = useProductsInvalidate();
  const ok = (message: string) => () => { invalidate(); toast.success(message); };
  return {
    activate: useMutation({ mutationFn: adminProductsApi.activate, onSuccess: ok("Produto ativado.") }),
    deactivate: useMutation({ mutationFn: adminProductsApi.deactivate, onSuccess: ok("Produto desativado.") }),
    remove: useMutation({ mutationFn: adminProductsApi.remove, onSuccess: ok("Produto excluído.") }),
    setStock: useMutation({
      mutationFn: ({ productId, stock }: { productId: string; stock: number }) => adminProductsApi.setStock(productId, stock),
      onSuccess: ok("Estoque atualizado."),
    }),
  };
}

export function useUpdateProduct(productId: string) {
  const invalidate = useProductsInvalidate();
  return useMutation({
    mutationFn: (payload: ProductUpdateIn) => adminProductsApi.update(productId, payload),
    onSuccess: () => { invalidate(); toast.success("Produto atualizado."); },
    meta: { errorToast: false },
  });
}

export function useCreateProductFull() {
  const invalidate = useProductsInvalidate();
  return useMutation({
    mutationFn: adminProductsApi.createFull,
    onSuccess: () => { invalidate(); toast.success("Produto criado."); },
    meta: { errorToast: false },
  });
}

export function useProductImages(productId: string) {
  const invalidate = useProductsInvalidate();
  return {
    add: useMutation({ mutationFn: (file: File) => adminProductsApi.addImage(productId, file), onSuccess: invalidate }),
    setCover: useMutation({ mutationFn: adminProductsApi.setCover, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: adminProductsApi.removeImage, onSuccess: invalidate }),
  };
}

// ── Categorias ───────────────────────────────────────────────────────────────
export function useAdminCategories() {
  return useQuery({ queryKey: K.categories, queryFn: ({ signal }) => adminCategoriesApi.list({}, signal) });
}

export function useCategoryActions() {
  const queryClient = useQueryClient();
  const done = (message?: string) => () => {
    void queryClient.invalidateQueries({ queryKey: K.categories });
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }); // menu público
    if (message) toast.success(message);
  };
  return {
    create: useMutation({ mutationFn: (p: CategoryCreateIn) => adminCategoriesApi.create(p), onSuccess: done("Categoria criada."), meta: { errorToast: false } }),
    update: useMutation({
      mutationFn: ({ id, ...p }: { id: string } & CategoryUpdateIn) => adminCategoriesApi.update(id, p),
      onSuccess: done("Categoria atualizada."), meta: { errorToast: false },
    }),
    toggle: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? adminCategoriesApi.activate(id) : adminCategoriesApi.deactivate(id)),
      onSuccess: done(),
    }),
    remove: useMutation({ mutationFn: adminCategoriesApi.remove, onSuccess: done("Categoria excluída.") }),
    uploadImage: useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => adminCategoriesApi.uploadImage(id, file), onSuccess: done("Imagem atualizada.") }),
    removeImage: useMutation({ mutationFn: adminCategoriesApi.removeImage, onSuccess: done("Imagem removida.") }),
  };
}

// ── Campanhas ────────────────────────────────────────────────────────────────
export function useAdminCampaigns() {
  return useQuery({ queryKey: K.campaigns, queryFn: ({ signal }) => adminCampaignsApi.list({}, signal) });
}

export function useCampaignImages(campaignId: string, enabled: boolean) {
  return useQuery({ queryKey: K.campaignImages(campaignId), queryFn: ({ signal }) => adminCampaignsApi.images(campaignId, signal), enabled });
}

export interface CreateCampaignWithImagesInput {
  data: CampaignCreateIn;
  images: File[];
  coverIndex: number;
  /** Campanha nasce inativa no backend; `true` ativa logo após criar (pra aparecer no carrossel). */
  activate: boolean;
}

/**
 * Cria a campanha e envia as imagens em seguida (o backend não tem endpoint "full" pra campanha).
 * Upload sequencial: a capa é marcada no próprio envio e `display_order` segue a ordem escolhida.
 * Falha de uma imagem não desfaz a campanha — volta em `failed` pra pessoa tentar de novo no card.
 */
export function useCreateCampaignWithImages() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorToast: false },
    mutationFn: async ({ data, images, coverIndex, activate }: CreateCampaignWithImagesInput) => {
      const campaign = await adminCampaignsApi.create(data);
      const failed: string[] = [];
      for (const [i, file] of images.entries()) {
        try {
          await adminCampaignsApi.addImage(campaign.campaign_id, file, { isCover: i === coverIndex, displayOrder: i });
        } catch (error) {
          failed.push(`${file.name}: ${toUserMessage(error, "falha no envio.")}`);
        }
      }
      if (activate) await adminCampaignsApi.activate(campaign.campaign_id);
      return { campaign, failed };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: K.campaigns });
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] }); // carrossel da home
    },
  });
}

export function useCampaignActions() {
  const queryClient = useQueryClient();
  const done = (message?: string) => () => {
    void queryClient.invalidateQueries({ queryKey: K.campaigns });
    // Carrossel da home: campanhas vigentes + imagens (chaves públicas, com staleTime de 5 min).
    void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    if (message) toast.success(message);
  };
  return {
    create: useMutation({ mutationFn: (p: CampaignCreateIn) => adminCampaignsApi.create(p), onSuccess: done("Campanha criada."), meta: { errorToast: false } }),
    update: useMutation({
      mutationFn: ({ id, ...p }: { id: string } & CampaignUpdateIn) => adminCampaignsApi.update(id, p),
      onSuccess: done("Campanha atualizada."), meta: { errorToast: false },
    }),
    toggle: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => (active ? adminCampaignsApi.activate(id) : adminCampaignsApi.deactivate(id)),
      onSuccess: done(),
    }),
    remove: useMutation({ mutationFn: adminCampaignsApi.remove, onSuccess: done("Campanha excluída.") }),
    addImage: useMutation({
      mutationFn: ({ id, file, isCover, displayOrder }: { id: string; file: File; isCover?: boolean; displayOrder?: number }) => adminCampaignsApi.addImage(id, file, { isCover, displayOrder }),
      onSuccess: (_d, v) => { void queryClient.invalidateQueries({ queryKey: K.campaignImages(v.id) }); done("Imagem enviada.")(); },
    }),
    setCover: useMutation({
      mutationFn: ({ imageId }: { imageId: string; campaignId: string }) => adminCampaignsApi.setCover(imageId),
      onSuccess: (_d, v) => { void queryClient.invalidateQueries({ queryKey: K.campaignImages(v.campaignId) }); done("Capa atualizada.")(); },
    }),
    removeImage: useMutation({
      mutationFn: ({ imageId }: { imageId: string; campaignId: string }) => adminCampaignsApi.removeImage(imageId),
      onSuccess: (_d, v) => { void queryClient.invalidateQueries({ queryKey: K.campaignImages(v.campaignId) }); done()(); },
    }),
  };
}

// ── Contatos ─────────────────────────────────────────────────────────────────
export function useAdminContacts(params: { status?: string; search?: string; page: number }) {
  return useQuery({ queryKey: K.contacts(params), queryFn: ({ signal }) => adminContactApi.list(params, signal), placeholderData: keepPreviousData });
}

export function useContactActions() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: [...K.all, "contacts"] });
  return {
    setStatus: useMutation({ mutationFn: ({ id, status }: { id: string; status: ContactStatus }) => adminContactApi.updateStatus(id, status), onSuccess: refresh }),
    remove: useMutation({ mutationFn: adminContactApi.remove, onSuccess: () => { refresh(); toast.success("Mensagem excluída."); } }),
  };
}

// ── Usuários ─────────────────────────────────────────────────────────────────
export function useAdminUsers(params: { search?: string; role?: string; isActive?: boolean; page: number }) {
  return useQuery({ queryKey: K.users(params), queryFn: ({ signal }) => adminUsersApi.list(params, signal), placeholderData: keepPreviousData });
}

export function useUserActions() {
  const queryClient = useQueryClient();
  const refresh = (message: string) => () => { void queryClient.invalidateQueries({ queryKey: [...K.all, "users"] }); toast.success(message); };
  return {
    deactivate: useMutation({ mutationFn: adminUsersApi.deactivate, onSuccess: refresh("Usuário desativado.") }),
    reactivate: useMutation({ mutationFn: adminUsersApi.reactivate, onSuccess: refresh("Usuário reativado.") }),
  };
}

// ── Moderação de avaliações ──────────────────────────────────────────────────
export function useAdminReviews(tab: "pending" | "authorized") {
  return useQuery({
    queryKey: tab === "pending" ? K.reviewsPending : K.reviewsAuthorized,
    queryFn: ({ signal }) => (tab === "pending" ? reviewsApi.adminPending(signal) : reviewsApi.adminAuthorized(signal)),
  });
}

export function useReviewModeration() {
  const queryClient = useQueryClient();
  const refresh = (message: string) => () => {
    void queryClient.invalidateQueries({ queryKey: [...K.all, "reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["reviews"] }); // vitrine
    toast.success(message);
  };
  return {
    authorize: useMutation({ mutationFn: reviewsApi.authorize, onSuccess: refresh("Avaliação publicada.") }),
    revoke: useMutation({ mutationFn: reviewsApi.revoke, onSuccess: refresh("Avaliação despublicada.") }),
    remove: useMutation({ mutationFn: reviewsApi.adminRemove, onSuccess: refresh("Avaliação excluída.") }),
  };
}