import { useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, MessageCircle, Package, UserRound, X } from "lucide-react";
import { Link, NavLink } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { displayName } from "@/features/auth/display-name";
import { useCategories } from "@/features/categories/queries";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryThumb } from "./CategoryThumb";
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES, type NavItem } from "./nav";

const ROW_CLASS = "flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-espresso/5";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return open ? <MobileMenuPanel onClose={onClose} /> : null;
}

function MobileMenuPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { me, isAuthenticated, status, logout } = useAuth();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const categories = useCategories({ enabled: categoriesOpen });

  useFocusTrap(true, panelRef);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    onClose();
  };

  const renderNavLink = (item: NavItem) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onClose}
        className={({ isActive }) => cn(ROW_CLASS, isActive && "bg-oxblood-50 text-oxblood-700")}
      >
        {item.label}
      </NavLink>
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="relative flex h-full w-[min(22rem,92vw)] flex-col overflow-y-auto bg-cream p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <Link to="/" onClick={onClose} aria-label="Sol e Arte — página inicial">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="grid size-11 place-items-center rounded-full hover:bg-espresso/5"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Principal" className="mt-6">
          <ul className="space-y-1">
            {NAV_BEFORE_CATEGORIES.map(renderNavLink)}

            <li>
              <button
                type="button"
                aria-expanded={categoriesOpen}
                aria-controls="mobile-categorias"
                onClick={() => setCategoriesOpen((current) => !current)}
                className={ROW_CLASS}
              >
                <span className="flex-1 text-left">Categorias</span>
                <ChevronDown
                  className={cn("size-5 transition-transform", categoriesOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              {categoriesOpen && (
                <div id="mobile-categorias" className="ml-2 mt-1 border-l-2 border-sand-200 pl-3">
                  <MobileCategories
                    isPending={categories.isPending}
                    isError={categories.isError}
                    error={categories.error}
                    isFetching={categories.isFetching}
                    refetch={() => void categories.refetch()}
                    items={categories.data?.items ?? []}
                    onNavigate={onClose}
                  />
                </div>
              )}
            </li>

            {NAV_AFTER_CATEGORIES.map(renderNavLink)}
          </ul>
        </nav>

        <div className="mt-6 border-t border-sand-200 pt-4">
          <ul className="space-y-1">
            <li>
              <Link to="/chat" onClick={onClose} className={ROW_CLASS}>
                <MessageCircle className="size-5 text-ink-soft" aria-hidden="true" />
                Chat
              </Link>
            </li>
            <li>
              <Link to="/notificacoes" onClick={onClose} className={ROW_CLASS}>
                <Bell className="size-5 text-ink-soft" aria-hidden="true" />
                Notificações
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-auto pt-6">
          {status === "loading" ? null : isAuthenticated && me ? (
            <div className="space-y-1 rounded-md bg-white p-3">
              <p className="truncate px-3 pt-1 font-semibold">{displayName(me)}</p>
              <p className="truncate px-3 pb-2 text-sm text-ink-soft">{me.user.email}</p>
              <Link to="/painel" onClick={onClose} className={ROW_CLASS}>
                <UserRound className="size-5 text-ink-soft" aria-hidden="true" />
                Minha conta
              </Link>
              <Link to="/painel/meus-pedidos" onClick={onClose} className={ROW_CLASS}>
                <Package className="size-5 text-ink-soft" aria-hidden="true" />
                Meus pedidos
              </Link>
              <Button variant="ghost" className={cn(ROW_CLASS, "rounded-md")} onClick={handleLogout} loading={loggingOut}>
                <LogOut className="size-5 text-ink-soft" aria-hidden="true" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/entrar" onClick={onClose} className={buttonStyles({ fullWidth: true, size: "lg" })}>
                Entrar
              </Link>
              <Link to="/cadastro" onClick={onClose} className={buttonStyles({ variant: "outline", fullWidth: true, size: "lg" })}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MobileCategoriesProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => void;
  items: { product_category_id: string; category_name: string; category_image_url: string }[];
  onNavigate: () => void;
}

function MobileCategories({ isPending, isError, error, isFetching, refetch, items, onNavigate }: MobileCategoriesProps) {
  if (isPending) {
    return (
      <div className="space-y-2 py-2" aria-busy="true" aria-label="Carregando categorias">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState className="px-0 py-4" error={error} onRetry={refetch} retrying={isFetching} title="Erro ao carregar" />;
  }
  if (items.length === 0) {
    return <p className="py-3 text-ink-soft">Nenhuma categoria disponível.</p>;
  }
  return (
    <ul className="py-1">
      {items.map((category) => (
        <li key={category.product_category_id}>
          <Link
            to={`/produtos?categoria=${category.product_category_id}`}
            onClick={onNavigate}
            className="flex min-h-12 items-center gap-3 rounded-md px-2 font-medium hover:bg-espresso/5"
          >
            <CategoryThumb src={category.category_image_url} className="size-9" />
            {category.category_name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
