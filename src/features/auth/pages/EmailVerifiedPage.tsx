import { CircleCheck, CircleX } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { AuthShell } from "../components/AuthShell";

/**
 * Destino do redirect do backend após clicar no link do e-mail:
 * /verificacao-concluida?status=success&email=…  ou  ?status=error&message=…
 * (o texto de `message` vem da URL, então mostramos uma mensagem fixa — nunca conteúdo da URL).
 */
export default function EmailVerifiedPage() {
  const [params] = useSearchParams();
  const success = params.get("status") === "success";
  const email = params.get("email");

  if (success) {
    const loginUrl = email ? `/entrar?email=${encodeURIComponent(email)}` : "/entrar";
    return (
      <AuthShell title="E-mail confirmado!" subtitle="Sua conta está ativa. Agora é só entrar.">
        <div className="space-y-6">
          <div className="grid size-14 place-items-center rounded-full bg-olive-50 text-olive-600">
            <CircleCheck className="size-7" aria-hidden="true" />
          </div>
          <Link to={loginUrl} className={buttonStyles({ fullWidth: true, size: "lg" })}>
            Entrar
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Não foi possível confirmar"
      subtitle="O link pode ter expirado ou já ter sido usado."
    >
      <div className="space-y-6">
        <div className="grid size-14 place-items-center rounded-full bg-oxblood-50 text-oxblood-600">
          <CircleX className="size-7" aria-hidden="true" />
        </div>
        <p className="text-ink-soft">
          Tente entrar com seu e-mail e senha: se a conta ainda não estiver ativa, você poderá pedir um novo
          link de confirmação na própria tela de login.
        </p>
        <Link to="/entrar" className={buttonStyles({ fullWidth: true, size: "lg" })}>
          Ir para o login
        </Link>
      </div>
    </AuthShell>
  );
}
