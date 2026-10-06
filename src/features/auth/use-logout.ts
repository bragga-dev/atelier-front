// frontend/src/features/auth/use-logout.ts
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./auth-context";

/**
 * Encerra a sessão e leva o usuário para a tela de login (sem `next`:
 * quem saiu por vontade própria não deve "voltar" à página privada ao entrar de novo).
 * Use este hook em vez de chamar `useAuth().logout` direto nos botões de sair.
 */
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(async () => {
    await logout();
    navigate("/entrar", { replace: true });
  }, [logout, navigate]);
}