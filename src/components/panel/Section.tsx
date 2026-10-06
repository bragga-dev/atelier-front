import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Cartão de seção dos painéis. */
export function Section({ title, description, children, className, action }: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}