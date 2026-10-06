import { createContext, useContext, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/** `true` dentro de um painel (que já tem Container próprio): evita gutters duplicados nas páginas aninhadas. */
export const InsidePanelContext = createContext(false);

/** Largura máxima e gutters padrão de todas as seções. */
export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  const insidePanel = useContext(InsidePanelContext);
  return <div className={cn(!insidePanel && "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", insidePanel && "w-full", className)} {...props} />;
}