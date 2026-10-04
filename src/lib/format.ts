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

/** Data e hora curtas: "14/03/2026 às 10:35". */
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date).replace(",", " às");
}

/**
 * Datas sem hora ("2026-09-25", como o `due_date` da cobrança) precisam ser lidas como data LOCAL:
 * `new Date("2026-09-25")` é meia-noite UTC e, no Brasil (UTC-3), viraria o dia 24.
 */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return dateFormatter.format(new Date(year, month - 1, day));
}