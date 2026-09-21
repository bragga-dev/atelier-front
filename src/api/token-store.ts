/**
 * Access token só em memória (nunca localStorage/sessionStorage): um XSS não consegue
 * ler o token depois que a aba fecha. A persistência da sessão fica por conta do
 * refresh token, que o backend guarda num cookie httpOnly (inacessível ao JS).
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};
