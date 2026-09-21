import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  pages: number;
  /** Gera a URL de cada página — links reais: funcionam com botão voltar, "abrir em nova aba" e compartilhamento. */
  buildHref: (page: number) => string;
  className?: string;
}

type PageItem = number | "gap-start" | "gap-end";

function pageItems(page: number, pages: number): PageItem[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items: PageItem[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) items.push("gap-start");
  for (let n = from; n <= to; n++) items.push(n);
  if (to < pages - 1) items.push("gap-end");
  items.push(pages);
  return items;
}

const CELL = "grid size-10 place-items-center rounded-md border text-sm font-semibold transition-colors";

export function Pagination({ page, pages, buildHref, className }: PaginationProps) {
  if (pages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < pages;

  return (
    <nav aria-label="Paginação" className={cn("flex items-center justify-center gap-1.5", className)}>
      {hasPrev ? (
        <Link to={buildHref(page - 1)} aria-label="Página anterior" className={cn(CELL, "border-sand-200 bg-white hover:border-oxblood-600")}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(CELL, "border-transparent text-ink-soft/40")}>
          <ChevronLeft className="size-5" />
        </span>
      )}

      {/* Celular: só "Página X de Y" (não cabem todos os números) */}
      <p className="px-3 text-sm text-ink-soft sm:hidden">
        Página <strong className="text-ink">{page}</strong> de {pages}
      </p>

      <ul className="hidden items-center gap-1.5 sm:flex">
        {pageItems(page, pages).map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="px-1 text-ink-soft">
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span aria-current="page" className={cn(CELL, "border-oxblood-600 bg-oxblood-600 text-cream")}>
                  {item}
                </span>
              ) : (
                <Link
                  to={buildHref(item)}
                  aria-label={`Ir para a página ${item}`}
                  className={cn(CELL, "border-sand-200 bg-white hover:border-oxblood-600")}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      {hasNext ? (
        <Link to={buildHref(page + 1)} aria-label="Próxima página" className={cn(CELL, "border-sand-200 bg-white hover:border-oxblood-600")}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(CELL, "border-transparent text-ink-soft/40")}>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}