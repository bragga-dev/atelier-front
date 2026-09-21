import { cn } from "@/lib/cn";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? "status" : undefined} aria-label={label} className="inline-flex">
      <svg
        className={cn("size-5 animate-spin", className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Tela de carregamento (troca de rota / restauração de sessão). */
export function PageSpinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-oxblood-600">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-8" label={label} />
        <p className="text-sm text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
