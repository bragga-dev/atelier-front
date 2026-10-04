/** Só deixa passar links https (ou http em localhost) — nunca `javascript:` ou `data:` vindos de fora. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && isLocalhost)) return url.toString();
  } catch {
    // URL inválida
  }
  return null;
}