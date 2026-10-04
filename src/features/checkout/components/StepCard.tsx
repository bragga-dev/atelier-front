import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface StepCardProps {
  number: number;
  title: string;
  /** Etapa concluída: mostra o check e o resumo no lugar do número. */
  done?: boolean;
  /** Etapa bloqueada até a anterior ser concluída. */
  locked?: boolean;
  /** Ação no canto (ex.: "Alterar"). */
  action?: ReactNode;
  children?: ReactNode;
}

/** Cartão numerado de uma etapa do checkout. */
export function StepCard({ number, title, done = false, locked = false, action, children }: StepCardProps) {
  return (
    <section
      aria-labelledby={`etapa-${number}`}
      className={cn(
        "rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 sm:p-6",
        locked && "opacity-60",
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
            done ? "bg-olive-600 text-cream" : "bg-espresso text-cream",
          )}
        >
          {done ? <Check className="size-4" /> : number}
        </span>
        <h2 id={`etapa-${number}`} className="flex-1 text-2xl font-semibold">
          {title}
        </h2>
        {action}
      </header>
      {!locked && children && <div className="mt-5">{children}</div>}
    </section>
  );
}