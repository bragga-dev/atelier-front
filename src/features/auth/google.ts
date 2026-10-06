/**
 * Google Identity Services (GIS). O script é carregado sob demanda (só nas telas de login/cadastro)
 * e o `credential` devolvido é um ID token JWT que o backend valida (`POST /auth/google`).
 */
const GIS_SRC = "https://accounts.google.com/gsi/client";

interface CredentialResponse {
  credential?: string;
}

export interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<GoogleAccountsId> | null = null;

export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error("Google Identity Services indisponível."));
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o login do Google."));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null; // permite tentar de novo (ex.: voltou a rede)
    throw error;
  });

  return scriptPromise;
}