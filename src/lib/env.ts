const DEFAULT_API_URL = "http://localhost:8000/api";

export const env = {
  /** URL base da API, sem barra no final. Ex.: https://api.solearte.com.br/api */
  apiUrl: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ""),
} as const;
