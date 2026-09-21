import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto max-w-md px-4 py-12 text-center", className)}>
      {icon && (
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-gold-300/30 text-gold-600">
          {icon}
        </div>
      )}
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {description && <p className="mt-2 text-ink-soft">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
