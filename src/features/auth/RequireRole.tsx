import { Navigate, Outlet } from "react-router";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "./auth-context";

/**
 * Restringe um grupo de rotas a um perfil. Deve ficar DENTRO de <RequireAuth /> (que cuida do login).
 * Perfil errado volta para a área do outro perfil — a API continua sendo a barreira real (403).
 */
function RequireRole({ role, fallback }: { role: "admin" | "client"; fallback: string }) {
  const { me, status } = useAuth();
  if (status === "loading" || !me) return <PageSpinner label="Verificando sua conta…" />;
  if (me.user.role !== role) return <Navigate to={fallback} replace />;
  return <Outlet />;
}

export const RequireClient = () => <RequireRole role="client" fallback="/admin" />;
export const RequireAdmin = () => <RequireRole role="admin" fallback="/painel" />;