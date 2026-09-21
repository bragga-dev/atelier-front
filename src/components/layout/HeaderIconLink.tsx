import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

interface HeaderIconLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Contador exibido no canto do ícone (só aparece se > 0). */
  badge?: number;
  className?: string;
}

export function HeaderIconLink({ to, label, icon: Icon, badge, className }: HeaderIconLinkProps) {
  const hasBadge = typeof badge === "number" && badge > 0;
  return (
    <Link
      to={to}
      aria-label={hasBadge ? `${label} (${badge})` : label}
      className={cn("relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-espresso/5", className)}
    >
      <Icon className="size-6" aria-hidden="true" />
      {hasBadge && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-oxblood-600 px-1 text-[11px] font-bold leading-none text-white"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
