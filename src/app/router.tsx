import type { ComponentType } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { GuestOnly } from "@/features/auth/GuestOnly";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RootLayout } from "@/components/layout/RootLayout";
import { PageSpinner } from "@/components/ui/Spinner";
import ComingSoonPage from "@/pages/ComingSoonPage";
import RouteErrorPage from "@/pages/RouteErrorPage";

/** Code splitting por rota: cada página vira um chunk carregado sob demanda. */
function lazyPage(load: () => Promise<{ default: ComponentType }>): Pick<RouteObject, "lazy"> {
  return {
    lazy: async () => ({ Component: (await load()).default }),
  };
}

const soon = (title: string, phase: string) => ({
  element: <ComingSoonPage title={title} phase={phase} />,
});

/** Fábrica (e não singleton) para permitir criar um router novo por teste/montagem. */
export function createAppRouter() {
  return createBrowserRouter(routes);
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      { index: true, ...lazyPage(() => import("@/pages/HomePage")) },

      // ── Autenticação (rotas de e-mail definidas pelo backend: /redefinir-senha, /verificacao-concluida)
      {
        element: <GuestOnly />,
        children: [
          { path: "entrar", ...lazyPage(() => import("@/features/auth/pages/LoginPage")) },
          { path: "cadastro", ...lazyPage(() => import("@/features/auth/pages/RegisterPage")) },
          { path: "esqueci-senha", ...lazyPage(() => import("@/features/auth/pages/ForgotPasswordPage")) },
        ],
      },
      { path: "redefinir-senha", ...lazyPage(() => import("@/features/auth/pages/ResetPasswordPage")) },
      { path: "verifique-seu-email", ...lazyPage(() => import("@/features/auth/pages/VerifyEmailPendingPage")) },
      { path: "verificacao-concluida", ...lazyPage(() => import("@/features/auth/pages/EmailVerifiedPage")) },

      // ── Vitrine
      { path: "categorias", ...lazyPage(() => import("@/pages/CategoriesPage")) },
      { path: "produtos", ...lazyPage(() => import("@/pages/ProductsPage")) },
      { path: "produtos/:productId/:slug?", ...lazyPage(() => import("@/pages/ProductPage")) },
      { path: "contato", ...lazyPage(() => import("@/pages/ContactPage")) },

      // ── Área logada
      {
        element: <RequireAuth />,
        children: [
          { path: "carrinho", ...soon("Carrinho", "Fase 4 — Carrinho") },
          { path: "notificacoes", ...soon("Notificações", "Fase 6 — Conta") },
          { path: "chat", ...soon("Chat com a loja", "Fase 6 — Conta") },
          // O backend gera links de e-mail e notificações apontando para /painel/… — mantemos esse prefixo.
          { path: "painel", ...soon("Minha conta", "Fase 6 — Conta") },
          { path: "painel/meus-pedidos", ...soon("Meus pedidos", "Fase 5 — Checkout e pedidos") },
        ],
      },

      // Links legados que o backend ainda emite (herança de outro projeto).
      { path: "comprar-mais", element: <Navigate to="/produtos" replace /> },
      { path: "painel/meus-agendamentos/:id", element: <Navigate to="/painel/meus-pedidos" replace /> },

      { path: "*", ...lazyPage(() => import("@/pages/NotFoundPage")) },
    ],
  },
];