import { Navigate, Outlet, useLocation } from "react-router";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "./auth-context";

/** Protege rotas privadas: sem sessão, vai para o login e volta depois (`next`). */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageSpinner label="Verificando sua sessão…" />;

  if (status === "anonymous") {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/entrar?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
