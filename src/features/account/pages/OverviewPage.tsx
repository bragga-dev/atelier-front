import { ArrowRight, Bell, MessageCircle, Package, UserRound } from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { displayName } from "@/features/auth/display-name";
import { isProfileComplete } from "@/features/checkout/components/ProfileStep";
import { OrderStatusBadge } from "@/features/orders/components/StatusBadges";
import { useOrders } from "@/features/orders/queries";
import { useUnreadCount } from "@/features/notifications/queries";
import { formatBRL, formatDate } from "@/lib/format";

function Tile({ to, icon: Icon, title, hint }: { to: string; icon: typeof Package; title: string; hint: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 transition-shadow hover:shadow-card">
      <span className="grid size-11 place-items-center rounded-full bg-oxblood-50 text-oxblood-600"><Icon className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-sm text-ink-soft">{hint}</span></span>
      <ArrowRight className="size-5 text-ink-soft" aria-hidden="true" />
    </Link>
  );
}

export default function OverviewPage() {
  const { me } = useAuth();
  const orders = useOrders();
  const { data: unread } = useUnreadCount();
  const last = orders.data?.[0];

  return (
    <>
      <PageHeader title={`Olá, ${me ? displayName(me) : ""}!`} description="Acompanhe seus pedidos e gerencie sua conta." />

      {me && !isProfileComplete(me.client) && (
        <Alert tone="info" className="mb-6">
          Complete seu perfil (nome, sobrenome e CPF) para poder finalizar compras.{" "}
          <Link to="/painel/perfil" className="font-semibold underline">Completar agora</Link>
        </Alert>
      )}

      <Section title="Último pedido" className="mb-6">
        {orders.isPending ? <Skeleton className="h-16" /> : last ? (
          <Link to={`/painel/meus-pedidos/${last.order_id}`} className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className="block font-semibold">Pedido {last.code}</span>
              <span className="block text-sm text-ink-soft">{formatDate(last.created_at)} · {formatBRL(last.total_geral)}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={last.order_status} label={last.order_status_label} />
              {last.shipping_tracking_code && <span className="text-xs text-ink-soft">Rastreio: {last.shipping_tracking_code}</span>}
            </span>
          </Link>
        ) : <p className="text-sm text-ink-soft">Você ainda não fez nenhum pedido. <Link to="/produtos" className="font-semibold text-oxblood-700 underline">Ver produtos</Link></p>}
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile to="/painel/meus-pedidos" icon={Package} title="Meus pedidos" hint="Histórico, pagamento e rastreio" />
        <Tile to="/painel/notificacoes" icon={Bell} title="Notificações" hint={unread ? `${unread} não lida${unread > 1 ? "s" : ""}` : "Tudo em dia"} />
        <Tile to="/painel/chat" icon={MessageCircle} title="Chat com a loja" hint="Tire dúvidas com a gente" />
        <Tile to="/painel/perfil" icon={UserRound} title="Meu perfil" hint="Dados pessoais e foto" />
      </div>
    </>
  );
}