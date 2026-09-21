import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { CategoryOut } from "@/api/types";
import { SelectField } from "@/components/ui/Field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/cn";
import type { CatalogFilters, CatalogSort } from "../catalog-params";

interface CatalogFiltersBarProps {
  filters: CatalogFilters;
  categories: CategoryOut[];
  categoriesLoading: boolean;
  /** Recebe só o que mudou; a página volta para 1 fora daqui. */
  onChange: (changes: Partial<Omit<CatalogFilters, "page">>) => void;
}

const SEARCH_DEBOUNCE_MS = 400;

export function CatalogFiltersBar({ filters, categories, categoriesLoading, onChange }: CatalogFiltersBarProps) {
  const [text, setText] = useState(filters.search);
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);
  // Última busca que NÓS empurramos para a URL — distingue "eu digitei" de "a URL mudou por fora".
  const pushedSearch = useRef(filters.search);

  useEffect(() => {
    const value = debounced.trim();
    if (value !== pushedSearch.current) {
      pushedSearch.current = value;
      onChange({ search: value });
    }
  }, [debounced, onChange]);

  useEffect(() => {
    // URL mudou por fora (ex.: "Limpar filtros", botão voltar): sincroniza o campo.
    if (filters.search !== pushedSearch.current) {
      pushedSearch.current = filters.search;
      setText(filters.search);
    }
  }, [filters.search]);

  return (
    <div className="space-y-4">
      <div role="search">
        <label htmlFor="busca-produtos" className="sr-only">
          Buscar produtos
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            id="busca-produtos"
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Buscar por produto ou categoria"
            autoComplete="off"
            enterKeyHint="search"
            className="block h-12 w-full rounded-md border border-sand-200 bg-white pl-12 pr-11 text-base placeholder:text-ink-soft/60 hover:border-ink/30 focus-visible:border-navy-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-espresso/5 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <SelectField
          label="Categoria"
          value={filters.categoryId ?? ""}
          disabled={categoriesLoading && categories.length === 0}
          onChange={(event) => onChange({ categoryId: event.target.value || null })}
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.product_category_id} value={category.product_category_id}>
              {category.category_name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Ordenar por"
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value as CatalogSort })}
        >
          <option value="alpha">Ordem alfabética</option>
          <option value="recent">Mais recentes</option>
        </SelectField>

        <label
          className={cn(
            "flex h-12 cursor-pointer items-center gap-3 rounded-md border border-sand-200 bg-white px-4 text-sm font-semibold hover:border-ink/30 sm:col-span-2 lg:col-span-1",
          )}
        >
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(event) => onChange({ inStockOnly: event.target.checked })}
            className="size-4 accent-oxblood-600"
          />
          Somente disponíveis
        </label>
      </div>
    </div>
  );
}