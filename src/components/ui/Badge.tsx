import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "warning" | "success" | "neutral" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  warning: "bg-gold-300/40 text-gold-600",
  success: "bg-olive-100 text-olive-700",
  neutral: "bg-sand-200 text-ink-soft",
  danger: "bg-oxblood-100 text-oxblood-700",
  info: "bg-navy-500/10 text-navy-600",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}