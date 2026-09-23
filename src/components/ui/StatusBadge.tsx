import { cn } from "@/lib/cn";

export type StatusTone = "pending" | "success" | "error";

const TONES: Record<StatusTone, string> = {
  pending: "bg-sand text-ink-soft",
  success: "bg-olive-50 text-olive-800",
  error: "bg-oxblood-50 text-oxblood-700",
};

export function StatusBadge({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}