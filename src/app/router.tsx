import type { ComponentType } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { GuestOnly } from "@/features/auth/GuestOnly";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireAdmin, RequireClient } from "@/features/auth/RequireRole";
import { AdminPanelLayout } from "@/features/admin/AdminPanelLayout";
import { ClientPanelLayout } from "@/features/account/ClientPanelLayout";
import { RootLayout } from "@/components/layout/RootLayout";
import { PageSpinner } from "@/components/ui/Spinner";
import RouteErrorPage from "@/pages/RouteErrorPage";

/** Code splitting por rota: cada página vira um chunk carregado sob demanda. */
function lazyPage(load: () => Promise<{ default: ComponentType }>): Pick<RouteObject, "lazy"> {
  return {
    lazy: async () => ({ Component: (await load()).default }),
  };
}

/** Fábrica (e não singleton) para permitir criar um router novo por teste/montagem. */
export function createAppRouter() {
  return createBrowserRouter(routes);
}

const pageRoutes: RouteObject[] = [
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
      // Carrinho e checkout: as próprias páginas explicam o caso "conta administrativa".
      { path: "carrinho", ...lazyPage(() => import("@/pages/CartPage")) },
      { path: "checkout", ...lazyPage(() => import("@/pages/CheckoutPage")) },

      // Cliente: o painel "Minha conta".
      {
        element: <RequireClient />,
        children: [
          // Atalhos antigos do header e das notificações → painel.
          { path: "notificacoes", element: <Navigate to="/painel/notificacoes" replace /> },
          { path: "chat", element: <Navigate to="/painel/chat" replace /> },
          // O backend gera links de e-mail e notificações apontando para /painel/… — mantemos esse prefixo.
          {
            path: "painel",
            element: <ClientPanelLayout />,
            children: [
              { index: true, ...lazyPage(() => import("@/features/account/pages/OverviewPage")) },
              { path: "meus-pedidos", ...lazyPage(() => import("@/pages/OrdersPage")) },
              { path: "meus-pedidos/:orderId", ...lazyPage(() => import("@/pages/OrderDetailPage")) },
              { path: "meus-pedidos/:orderId/pagamento", ...lazyPage(() => import("@/pages/OrderPaymentPage")) },
              { path: "perfil", ...lazyPage(() => import("@/features/account/pages/ProfilePage")) },
              { path: "enderecos", ...lazyPage(() => import("@/features/account/pages/AddressesPage")) },
              { path: "avaliacoes", ...lazyPage(() => import("@/features/account/pages/MyReviewsPage")) },
              { path: "notificacoes", ...lazyPage(() => import("@/features/account/pages/NotificationsPage")) },
              { path: "chat", ...lazyPage(() => import("@/features/chat/pages/ClientChatPage")) },
              { path: "seguranca", ...lazyPage(() => import("@/features/account/pages/SecurityPage")) },
            ],
          },
        ],
      },

      // Administrador.
      {
        element: <RequireAdmin />,
        children: [
          {
            path: "admin",
            element: <AdminPanelLayout />,
            children: [
              { index: true, ...lazyPage(() => import("@/features/admin/pages/DashboardPage")) },
              { path: "pedidos", ...lazyPage(() => import("@/features/admin/pages/AdminOrdersPage")) },
              { path: "pedidos/:orderId", ...lazyPage(() => import("@/features/admin/pages/AdminOrderDetailPage")) },
              { path: "produtos", ...lazyPage(() => import("@/features/admin/pages/AdminProductsPage")) },
              { path: "produtos/novo", ...lazyPage(() => import("@/features/admin/pages/AdminProductFormPage")) },
              { path: "produtos/:productId", ...lazyPage(() => import("@/features/admin/pages/AdminProductFormPage")) },
              { path: "categorias", ...lazyPage(() => import("@/features/admin/pages/AdminCategoriesPage")) },
              { path: "campanhas", ...lazyPage(() => import("@/features/admin/pages/AdminCampaignsPage")) },
              { path: "avaliacoes", ...lazyPage(() => import("@/features/admin/pages/AdminReviewsPage")) },
              { path: "chat", ...lazyPage(() => import("@/features/chat/pages/AdminChatPage")) },
              { path: "contatos", ...lazyPage(() => import("@/features/admin/pages/AdminContactsPage")) },
              { path: "usuarios", ...lazyPage(() => import("@/features/admin/pages/AdminUsersPage")) },
              { path: "perfil", ...lazyPage(() => import("@/features/account/pages/ProfilePage")) },
            ],
          },
        ],
      },
    ],
  },

  // Links legados que o backend ainda emite (herança de outro projeto).
  { path: "comprar-mais", element: <Navigate to="/produtos" replace /> },
  { path: "painel/meus-agendamentos/:id", element: <Navigate to="/painel/meus-pedidos" replace /> },

  { path: "*", ...lazyPage(() => import("@/pages/NotFoundPage")) },
];

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      // errorElement fica um nível abaixo da RootLayout (não na rota do layout em si): um erro de
      // render numa página troca só o conteúdo do <Outlet> — o header e o footer continuam de pé,
      // então a pessoa não fica presa numa tela sem navegação nenhuma.
      { errorElement: <RouteErrorPage />, children: pageRoutes },
    ],
  },
];