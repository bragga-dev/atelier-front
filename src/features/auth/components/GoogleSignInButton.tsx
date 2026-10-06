import { useEffect, useRef, useState } from "react";
import { toUserMessage } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { env } from "@/lib/env";
import { useAuth } from "../auth-context";
import { loadGoogleIdentity, type GoogleButtonOptions } from "../google";

interface GoogleSignInButtonProps {
  text?: GoogleButtonOptions["text"];
  /** Chamado com a mensagem de erro (ou null ao tentar de novo). */
  onError?: (message: string | null) => void;
}

/**
 * Botão oficial "Continuar com Google". Após o login a sessão fica "authenticated" e o
 * <GuestOnly> redireciona para `next`. Sem `VITE_GOOGLE_CLIENT_ID` não renderiza nada.
 */
export function GoogleSignInButton({ text = "continue_with", onError }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // A callback do GIS é registrada uma vez; a ref garante que usa sempre a versão atual.
  const handlerRef = useRef<(idToken: string) => Promise<void>>(async () => undefined);

  handlerRef.current = async (idToken) => {
    onError?.(null);
    try {
      await loginWithGoogle(idToken);
    } catch (error) {
      onError?.(toUserMessage(error));
    }
  };

  useEffect(() => {
    if (!env.googleClientId) return;
    let cancelled = false;

    loadGoogleIdentity()
      .then((gis) => {
        if (cancelled || !containerRef.current) return;
        gis.initialize({
          client_id: env.googleClientId,
          callback: ({ credential }) => {
            if (credential) void handlerRef.current(credential);
          },
          cancel_on_tap_outside: true,
        });
        containerRef.current.replaceChildren();
        gis.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "left",
          locale: "pt-BR",
          width: Math.min(containerRef.current.clientWidth || 320, 400),
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Login com Google indisponível.");
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!env.googleClientId) return null;

  return (
    <div>
      {loadError ? (
        <Alert tone="error">{loadError}</Alert>
      ) : (
        <div ref={containerRef} className="flex min-h-11 w-full justify-center" aria-label="Continuar com Google" />
      )}
    </div>
  );
}

/** Divisor "ou" usado entre o formulário e o botão do Google. */
export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft" role="separator">
      <span className="h-px flex-1 bg-sand-200" />
      ou
      <span className="h-px flex-1 bg-sand-200" />
    </div>
  );
}