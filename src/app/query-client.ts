import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError, isClientError, toUserMessage } from "@/api/errors";
import { toast } from "@/lib/toast";

/**
 * Meta opcional nas queries/mutations:
 *  - `errorToast: false`  → não mostra toast global de erro (a tela trata o erro sozinha);
 *  - `errorMessage`       → mensagem fixa no lugar da mensagem derivada do erro.
 */
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { errorToast?: boolean; errorMessage?: string };
    mutationMeta: { errorToast?: boolean; errorMessage?: string };
  }
}

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isClientError(error)) return false; // 4xx (exceto 429): repetir não muda nada
  return failureCount < MAX_RETRIES;
}

function notifyError(error: unknown, meta?: { errorToast?: boolean; errorMessage?: string }): void {
  if (meta?.errorToast === false) return;
  // 401 já é tratado pela camada de sessão (refresh / redirecionamento para o login).
  if (isApiError(error) && error.status === 401) return;
  toast.error(meta?.errorMessage ?? toUserMessage(error));
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      // Por padrão queries NÃO mostram toast (a própria tela mostra ErrorState).
      // Quem quiser toast global usa `meta: { errorToast: true }` — ver mutations abaixo.
      onError: (error, query) => {
        if (query.meta?.errorToast === true) notifyError(error, query.meta);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => notifyError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
