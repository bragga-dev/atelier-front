// frontend/src/features/admin/AdminPanelLayout.tsx
import { BarChart3, FolderTree, Inbox, Megaphone, MessageCircle, Package, ShoppingBag, Star, UserRound, Users } from "lucide-react";
import { PanelLayout, type PanelNavItem } from "@/components/panel/PanelLayout";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/features/auth/auth-context";
import { fullName, userPhotoUrl } from "@/features/auth/display-name";

const NAV: PanelNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/chat", label: "Chat", icon: MessageCircle },
  { to: "/admin/contatos", label: "Contatos", icon: Inbox },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/perfil", label: "Meu perfil", icon: UserRound },
];

export function AdminPanelLayout() {
  const { me } = useAuth();
  return (
    <PanelLayout
      title="Painel administrativo"
      nav={NAV}
      header={
        me && (
          <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-sand-200 bg-white p-3">
            <Avatar src={userPhotoUrl(me)} name={fullName(me)} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{fullName(me)}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-oxblood-700">Administrador</p>
            </div>
          </div>
        )
      }
    />
  );
}