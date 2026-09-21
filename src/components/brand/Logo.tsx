import { cn } from "@/lib/cn";

/** Rosácea de oito pontas (khatam) — versão vetorial e leve da mandala, legível em tamanhos pequenos. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-11", className)} aria-hidden="true" focusable="false">
      <circle cx={24} cy={24} r={22.5} fill="#f1e1cd" stroke="#b8893b" strokeWidth={1.4} />
      <rect x={11} y={11} width={26} height={26} fill="#8e2b24" stroke="#d4a94f" strokeWidth={0.9} />
      <rect
        x={11}
        y={11}
        width={26}
        height={26}
        fill="#8e2b24"
        fillOpacity={0.92}
        stroke="#d4a94f"
        strokeWidth={0.9}
        transform="rotate(45 24 24)"
      />
      <circle cx={24} cy={24} r={8.6} fill="#f1e1cd" stroke="#b8893b" strokeWidth={1} />
      <g stroke="#b8893b" strokeWidth={1.2} strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={24 + Math.cos(angle) * 4.2}
              y1={24 + Math.sin(angle) * 4.2}
              x2={24 + Math.cos(angle) * 6.6}
              y2={24 + Math.sin(angle) * 6.6}
            />
          );
        })}
      </g>
      <circle cx={24} cy={24} r={2.7} fill="#d4a94f" />
    </svg>
  );
}

/** Marca do header/footer: rosácea + "SOL E ARTE" em serifa clássica. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl font-semibold uppercase tracking-[0.14em] sm:text-[1.7rem]",
            tone === "dark" ? "text-ink" : "text-cream",
          )}
        >
          Sol e Arte
        </span>
        <span
          className={cn(
            "mt-1.5 hidden text-[0.6rem] font-medium uppercase tracking-[0.34em] sm:block",
            tone === "dark" ? "text-ink-soft" : "text-cream/70",
          )}
        >
          Artesanato com alma
        </span>
      </span>
    </span>
  );
}
