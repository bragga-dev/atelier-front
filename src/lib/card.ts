import { onlyDigits } from "./cpf";

/** Algoritmo de Luhn — rejeita número de cartão digitado errado antes de ir para a Asaas. */
export function isValidCardNumber(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** "4111111111111111" → "4111 1111 1111 1111". */
export function formatCardNumber(value: string): string {
  return onlyDigits(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1229" → "12/29". */
export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Valida "MM/AA" e devolve mês/ano ("12", "2029") — ou `null` se inválido/vencido. */
export function parseExpiry(value: string, now: Date = new Date()): { month: string; year: string } | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return null;

  // O cartão vale até o último dia do mês de validade.
  const lastValidMonth = new Date(year, month, 0, 23, 59, 59);
  if (lastValidMonth < now) return null;

  return { month: match[1]!, year: String(year) };
}