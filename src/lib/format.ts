const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** O backend envia valores monetários como string decimal ("199.90"). */
export function formatBRL(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? brl.format(amount) : "—";
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** Formata uma data ISO ("2026-03-14T10:00:00Z") como "14 de março de 2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}