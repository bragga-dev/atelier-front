import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "@/api/endpoints/account";
import { notificationsApi } from "@/api/endpoints/notifications";
import { profileApi } from "@/api/endpoints/profile";
import { reviewsApi } from "@/api/endpoints/reviews";
import { queryKeys } from "@/api/query-keys";
import type { ReviewUpdateIn } from "@/api/types";
import { tokenStore } from "@/api/token-store";
import { useAuth } from "@/features/auth/auth-context";
import { isAdminUser } from "@/features/auth/display-name";
import { toast } from "@/lib/toast";

// ── Foto do perfil (cliente e admin usam rotas diferentes) ────────────────────
export function useProfilePhoto() {
  const { me, refreshMe } = useAuth();
  const admin = isAdminUser(me);

  const upload = useMutation({
    mutationFn: async (file: File): Promise<void> => {
      await (admin ? profileApi.uploadAdminPhoto(file) : profileApi.uploadClientPhoto(file));
    },
    onSuccess: async () => {
      await refreshMe();
      toast.success("Foto atualizada.");
    },
  });
  const remove = useMutation({
    mutationFn: async (): Promise<void> => {
      await (admin ? profileApi.deleteAdminPhoto() : profileApi.deleteClientPhoto());
    },
    onSuccess: async () => {
      await refreshMe();
      toast.success("Foto removida.");
    },
  });
  return { upload, remove };
}

export function useUpdateAdminProfile() {
  const { refreshMe } = useAuth();
  return useMutation({
    mutationFn: profileApi.updateAdmin,
    onSuccess: async () => {
      await refreshMe();
      toast.success("Perfil atualizado.");
    },
    meta: { errorToast: false },
  });
}

// ── Segurança ────────────────────────────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: accountApi.changePassword,
    // O backend encerra as outras sessões e devolve um novo access token para esta.
    onSuccess: ({ access }) => {
      tokenStore.set(access);
      toast.success("Senha alterada. Os outros dispositivos foram desconectados.");
    },
    meta: { errorToast: false },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.account.sessions,
    queryFn: ({ signal }) => accountApi.sessions(signal),
    staleTime: 15_000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.revokeSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.sessions });
      toast.success("Sessão encerrada.");
    },
  });
}

export function useLogoutAll() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: accountApi.logoutAll,
    onSuccess: () => logout(),
  });
}

export function useDeleteAccount() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: accountApi.deleteAccount,
    onSuccess: () => logout(),
    meta: { errorToast: false },
  });
}

// ── Avaliações do cliente ────────────────────────────────────────────────────
export function useMyReviews() {
  return useQuery({
    queryKey: queryKeys.myReviews,
    queryFn: ({ signal }) => reviewsApi.mine(signal),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myReviews });
      toast.success("Obrigado! Sua avaliação será exibida após a moderação.");
    },
    meta: { errorToast: false },
  });
}

export function useUpdateReview(reviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewUpdateIn) => reviewsApi.update(reviewId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Avaliação atualizada. Ela volta para moderação antes de aparecer na loja.");
    },
    meta: { errorToast: false },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myReviews });
      toast.success("Avaliação excluída.");
    },
  });
}

// ── Notificações ─────────────────────────────────────────────────────────────
export function useNotifications(params: { page: number; unreadOnly: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: ({ signal }) => notificationsApi.list({ page: params.page, unreadOnly: params.unreadOnly }, signal),
    staleTime: 15_000,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

  return {
    markRead: useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh }),
    markAllRead: useMutation({
      mutationFn: notificationsApi.markAllRead,
      onSuccess: () => {
        refresh();
        toast.success("Tudo marcado como lido.");
      },
    }),
    remove: useMutation({ mutationFn: notificationsApi.remove, onSuccess: refresh }),
  };
}