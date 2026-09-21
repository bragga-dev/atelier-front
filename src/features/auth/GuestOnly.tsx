import { Navigate, Outlet, useSearchParams } from "react-router";
import { PageSpinner } from "@/components/ui/Spinner";
import { safeInternalPath } from "@/lib/safe-redirect";
import { useAuth } from "./auth-context";

/** Telas de login/cadastro: quem já está logado é redirecionado. */
export function GuestOnly() {
  const { status } = useAuth();
  const [params] = useSearchParams();

  if (status === "loading") return <PageSpinner label="Verificando sua sessão…" />;
  if (status === "authenticated") return <Navigate to={safeInternalPath(params.get("next"))} replace />;

  return <Outlet />;
}
