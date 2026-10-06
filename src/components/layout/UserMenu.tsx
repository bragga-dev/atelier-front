import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, MessageCircle, Package, User, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { useLogout } from "@/features/auth/use-logout";
import { useDismissable } from "@/hooks/use-dismissable";
import { cn } from "@/lib/cn";
import { buttonStyles } from "@/components/ui/button-styles";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { displayName, fullName, isAdminUser, userPhotoUrl } from "@/features/auth/display-name";

const PANEL_ID = "menu-usuario";

const ITEM_CLASS = "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-medium hover:bg-espresso/5";

export function UserMenu({ className }: { className?: string }) {
  const { me, isAuthenticated, status } = useAuth();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    close();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={isAuthenticated ? "Menu da minha conta" : "Entrar ou cadastrar"}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((current) => !current)}
        className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-espresso/5"
      >
        {isAuthenticated && me ? (
          <Avatar src={userPhotoUrl(me)} name={fullName(me)} size="md" />
        ) : (
          <User className="size-6" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id={PANEL_ID}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md border border-sand-200 bg-cream p-2 shadow-card"
        >
          {status === "loading" ? (
            <p className="px-3 py-2 text-sm text-ink-soft">Carregando…</p>
          ) : isAuthenticated && me ? (
            <>
              <div className="flex items-center gap-3 border-b border-sand-200 px-3 pb-3 pt-2">
                <Avatar src={userPhotoUrl(me)} name={fullName(me)} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName(me)}</p>
                  <p className="truncate text-sm text-ink-soft">{me.user.email}</p>
                </div>
              </div>
              <nav aria-label="Minha conta" className="py-2">
                {isAdminUser(me) ? (
                  <Link to="/admin" className={ITEM_CLASS}>
                    <LayoutDashboard className="size-5 text-ink-soft" aria-hidden="true" />
                    Painel administrativo
                  </Link>
                ) : (
                  <>
                    <Link to="/painel" className={ITEM_CLASS}>
                      <UserRound className="size-5 text-ink-soft" aria-hidden="true" />
                      Minha conta
                    </Link>
                    <Link to="/painel/meus-pedidos" className={ITEM_CLASS}>
                      <Package className="size-5 text-ink-soft" aria-hidden="true" />
                      Meus pedidos
                    </Link>
                    <Link to="/chat" className={ITEM_CLASS}>
                      <MessageCircle className="size-5 text-ink-soft" aria-hidden="true" />
                      Chat com a loja
                    </Link>
                  </>
                )}
              </nav>
              <Button variant="ghost" fullWidth className="justify-start rounded-md" onClick={handleLogout} loading={loggingOut}>
                <LogOut className="size-5 text-ink-soft" aria-hidden="true" />
                Sair
              </Button>
            </>
          ) : (
            <div className="space-y-2 p-2">
              <p className="text-sm text-ink-soft">Entre para acompanhar pedidos e finalizar compras.</p>
              <Link to="/entrar" className={buttonStyles({ fullWidth: true })}>
                Entrar
              </Link>
              <Link to="/cadastro" className={buttonStyles({ variant: "outline", fullWidth: true })}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}