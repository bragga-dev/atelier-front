const DEFAULT_API_URL = "http://localhost:8000/api";

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ""),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim(),
} as const;