import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints/auth";
import { isApiError } from "@/api/errors";
import { refreshAccessToken, setSessionLostHandler } from "@/api/session";
import { tokenStore } from "@/api/token-store";
import type { MeOut } from "@/api/types";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth-context";

interface AuthState {
  status: AuthStatus;
  me: MeOut | null;
}

const INITIAL_STATE: AuthState = { status: "loading", me: null };
const ANONYMOUS_STATE: AuthState = { status: "anonymous", me: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const mounted = useRef(true);

  const setAnonymous = useCallback(() => {
    tokenStore.clear();
    // Descarta qualquer dado privado em cache (carrinho, pedidos, notificações…).
    queryClient.clear();
    if (mounted.current) setState(ANONYMOUS_STATE);
  }, [queryClient]);

  // Sessão perdida (refresh recusado) → volta a anônimo; as rotas protegidas redirecionam.
  useEffect(() => {
    setSessionLostHandler(setAnonymous);
    return () => setSessionLostHandler(null);
  }, [setAnonymous]);

  // Restaura a sessão ao abrir o app: refresh (cookie httpOnly) → /auth/me.
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        await refreshAccessToken();
        const me = await authApi.me(controller.signal);
        if (mounted.current) setState({ status: "authenticated", me });
      } catch (error) {
        if (controller.signal.aborted) return;
        // Sem cookie/refresh inválido (401), e-mail não verificado (403) ou API fora do ar:
        // em todos os casos o visitante segue como anônimo.
        if (!isApiError(error)) console.error("Falha inesperada ao restaurar a sessão", error);
        tokenStore.clear();
        if (mounted.current) setState(ANONYMOUS_STATE);
      }
    })();

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async ({ email, password }) => {
      const { access } = await authApi.login({ email, password });
      tokenStore.set(access);
      let me: MeOut;
      try {
        me = await authApi.me();
      } catch (error) {
        tokenStore.clear();
        throw error;
      }
      queryClient.clear(); // nada do usuário anterior deve sobrar em cache
      setState({ status: "authenticated", me });
    },
    [queryClient],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    try {
      await authApi.logout(); // blacklista o refresh e limpa o cookie
    } catch {
      // Mesmo que falhe (offline/token vencido), encerramos a sessão local.
    } finally {
      setAnonymous();
    }
  }, [setAnonymous]);

  const refreshMe = useCallback<AuthContextValue["refreshMe"]>(async () => {
    const me = await authApi.me();
    setState({ status: "authenticated", me });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      me: state.me,
      isAuthenticated: state.status === "authenticated",
      login,
      logout,
      refreshMe,
    }),
    [state, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
