import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { Container, InsidePanelContext } from "@/components/layout/Container";
import { cn } from "@/lib/cn";

export interface PanelNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** `true` = só ativa na rota exata (ex.: visão geral). */
  end?: boolean;
  badge?: number;
}

interface PanelLayoutProps {
  title: string;
  nav: PanelNavItem[];
  /** Cabeçalho do menu lateral (ex.: avatar e nome). */
  header?: ReactNode;
}

/** Moldura dos painéis (cliente e admin): menu lateral no desktop, abas roláveis no mobile. */
export function PanelLayout({ title, nav, header }: PanelLayoutProps) {
  return (
    <Container className="py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {header && <div className="mb-4 hidden lg:block">{header}</div>}
          <nav aria-label={title}>
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {nav.map((item) => (
                <li key={item.to} className="shrink-0">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors lg:rounded-md",
                        isActive ? "bg-oxblood-50 text-oxblood-700" : "text-ink hover:bg-espresso/5",
                      )
                    }
                  >
                    <item.icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {typeof item.badge === "number" && item.badge > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-oxblood-600 px-1 text-[11px] font-bold text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <InsidePanelContext.Provider value={true}>
            <Outlet />
          </InsidePanelContext.Provider>
        </div>
      </div>
    </Container>
  );
}