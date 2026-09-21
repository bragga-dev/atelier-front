/**
 * Só aceita caminhos internos (começando com uma única "/"), evitando open redirect
 * via `?next=https://site-malicioso.com` ou `?next=//site-malicioso.com`.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
