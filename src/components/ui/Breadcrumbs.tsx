import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/** Trilha de navegação. O último item é sempre a página atual (sem link). */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Trilha de navegação" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
              <li className="min-w-0">
                {item.to && !isLast ? (
                  <Link to={item.to} className="truncate hover:text-oxblood-700 hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="truncate font-medium text-ink">
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}