import { Bell, KeyRound, LayoutDashboard, MapPin, MessageCircle, Package, Star, UserRound } from "lucide-react";
import { PanelLayout, type PanelNavItem } from "@/components/panel/PanelLayout";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/features/auth/auth-context";
import { fullName, userPhotoUrl } from "@/features/auth/display-name";
import { useUnreadCount } from "@/features/notifications/queries";


export function ClientPanelLayout() {
  const { me } = useAuth();
  const { data: unread } = useUnreadCount();

  const nav: PanelNavItem[] = [
    { to: "/painel", label: "Visão geral", icon: LayoutDashboard, end: true },
    { to: "/painel/meus-pedidos", label: "Meus pedidos", icon: Package },
    { to: "/painel/perfil", label: "Meu perfil", icon: UserRound },
    { to: "/painel/enderecos", label: "Endereços", icon: MapPin },
    { to: "/painel/avaliacoes", label: "Minhas avaliações", icon: Star },
    { to: "/painel/notificacoes", label: "Notificações", icon: Bell, badge: unread },
    { to: "/painel/chat", label: "Chat com a loja", icon: MessageCircle },
    { to: "/painel/seguranca", label: "Segurança", icon: KeyRound },
  ];

  return (
    <PanelLayout
      title="Minha conta"
      nav={nav}
      header={
        me && (
          <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-sand-200 bg-white p-3">
            <Avatar src={userPhotoUrl(me)} name={fullName(me)} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{fullName(me)}</p>
              <p className="truncate text-xs text-ink-soft">{me.user.email}</p>
            </div>
          </div>
        )
      }
    />
  );
}