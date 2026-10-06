import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Esconde a coluna em telas pequenas. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
}

/** Tabela simples com rolagem horizontal no mobile. Sem ordenação/filtro: isso fica na query. */
export function DataTable<T>({ columns, rows, rowKey, caption }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-sand-200 bg-white">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-sand/60 text-xs uppercase tracking-[0.08em] text-ink-soft">
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={cn("px-4 py-3 font-semibold", column.hideOnMobile && "hidden md:table-cell", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-200">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="align-middle hover:bg-cream/60">
              {columns.map((column) => (
                <td key={column.header} className={cn("px-4 py-3", column.hideOnMobile && "hidden md:table-cell", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}