import { useState } from "react";
import { Bell, Menu, MessageCircle, ShoppingCart } from "lucide-react";
import { Link, NavLink } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { useCartItemCount } from "@/features/cart/queries";
import { useUnreadCount } from "@/features/notifications/queries";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { OrnamentBand } from "@/components/brand/OrnamentBand";
import { buttonStyles } from "@/components/ui/button-styles";
import { CategoriesMenu } from "./CategoriesMenu";
import { Container } from "./Container";
import { HeaderIconLink } from "./HeaderIconLink";
import { MobileMenu } from "./MobileMenu";
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES, type NavItem } from "./nav";
import { UserMenu } from "./UserMenu";

function DesktopNavLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "inline-flex h-11 items-center px-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-oxblood-700",
          isActive && "text-oxblood-700 underline decoration-gold-500 decoration-2 underline-offset-[10px]",
        )
      }
    >
      {item.label}
    </NavLink>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status, isAuthenticated } = useAuth();
  const { data: cartCount } = useCartItemCount();
  const { data: unreadCount } = useUnreadCount();

  return (
    <>
      <div className="bg-espresso text-cream">
        <Container className="py-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.32em]">
          Artesanato com alma
        </Container>
      </div>

      <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand/95 backdrop-blur">
        <Container className="grid h-[4.5rem] grid-cols-[auto_1fr_auto] items-center gap-4 lg:h-24">
          <Link to="/" aria-label="Sol e Arte — página inicial" className="rounded-md">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="col-start-2 hidden items-center justify-self-center lg:flex">
            {NAV_BEFORE_CATEGORIES.map((item) => (
              <DesktopNavLink key={item.to} item={item} />
            ))}
            <CategoriesMenu />
            {NAV_AFTER_CATEGORIES.map((item) => (
              <DesktopNavLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="col-start-3 flex items-center gap-0.5 sm:gap-1">
            {status !== "loading" && !isAuthenticated && (
              <Link
                to="/entrar"
                className={buttonStyles({ size: "sm", variant: "outline", className: "mr-2 hidden lg:inline-flex" })}
              >
                Entrar / Cadastrar
              </Link>
            )}

            <HeaderIconLink to="/carrinho" label="Carrinho" icon={ShoppingCart} badge={cartCount} />
            <HeaderIconLink to="/notificacoes" label="Notificações" icon={Bell} badge={unreadCount} />
            <UserMenu className="hidden sm:block" />

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              aria-haspopup="dialog"
              className="grid size-11 place-items-center rounded-full hover:bg-espresso/5 lg:hidden"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <OrnamentBand />

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
