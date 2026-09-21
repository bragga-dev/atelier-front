import { cn } from "@/lib/cn";

/** Bloco pulsante para estados de carregamento (não é lido por leitores de tela). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-sand-200/70", className)} />;
}
