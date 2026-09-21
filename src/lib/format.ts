const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** O backend envia valores monetários como string decimal ("199.90"). */
export function formatBRL(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? brl.format(amount) : "—";
}