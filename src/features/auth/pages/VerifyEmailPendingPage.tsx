import { MailCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { AuthShell } from "../components/AuthShell";
import { ResendVerification } from "../components/ResendVerification";

/** Depois do cadastro: pede para confirmar o e-mail (a conta fica inativa até lá). */
export default function VerifyEmailPendingPage() {
  const [params] = useSearchParams();
  const email = params.get("email");

  return (
    <AuthShell
      title="Confirme seu e-mail"
      footer={
        <Link to="/entrar" className="font-semibold text-oxblood-700 hover:underline">
          Já confirmei — ir para o login
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="grid size-14 place-items-center rounded-full bg-olive-50 text-olive-600">
          <MailCheck className="size-7" aria-hidden="true" />
        </div>
        <p className="text-ink-soft">
          {email ? (
            <>
              Enviamos um link de confirmação para <strong className="text-ink">{email}</strong>.
            </>
          ) : (
            "Enviamos um link de confirmação para o seu e-mail."
          )}{" "}
          Abra a mensagem e clique no link para ativar sua conta. Não esqueça de olhar o spam.
        </p>
        {email && <ResendVerification email={email} />}
      </div>
    </AuthShell>
  );
}
