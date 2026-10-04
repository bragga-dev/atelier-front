/** Só os dígitos do CPF/CNPJ. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Mesma regra do backend (dígitos verificadores) — evita ida e volta por um CPF digitado errado. */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const check = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

/** "12345678909" → "123.456.789-09" (formata enquanto a pessoa digita). */
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** CPF (11) ou CNPJ (14) — o titular do cartão pode ser pessoa jurídica. */
export function isValidCpfOrCnpjLength(value: string): boolean {
  const length = onlyDigits(value).length;
  return length === 11 || length === 14;
}

/** "12345678909" → "***.456.789-**" — o suficiente para a pessoa reconhecer sem expor o número inteiro. */
export function maskCpf(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return value;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}