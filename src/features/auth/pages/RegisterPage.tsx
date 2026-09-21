import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { authApi } from "@/api/endpoints/auth";
import { isApiError, toUserMessage } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { applyApiErrors } from "../apply-api-errors";
import { AuthShell } from "../components/AuthShell";
import { registerSchema, type RegisterFormValues } from "../schemas";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", password2: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // A conta nasce inativa até confirmar o e-mail. O backend devolve um access token,
      // mas ele não dá acesso a nada enquanto o e-mail não for verificado — por isso NÃO
      // iniciamos sessão aqui: levamos a pessoa para a tela "confirme seu e-mail".
      await authApi.register(values);
      navigate(`/verifique-seu-email?email=${encodeURIComponent(values.email)}`, { replace: true });
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setError("email", { type: "server", message: toUserMessage(error) });
        return;
      }
      setFormError(
        applyApiErrors(
          error,
          setError,
          ["email", "password", "password2"],
          "Não foi possível criar sua conta. Tente novamente.",
        ),
      );
    }
  });

  const nextParam = params.get("next");
  const loginLink = nextParam ? `/entrar?next=${encodeURIComponent(nextParam)}` : "/entrar";

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Leva menos de um minuto. Você confirma o e-mail e já pode comprar."
      footer={
        <>
          Já tem conta?{" "}
          <Link to={loginLink} className="font-semibold text-oxblood-700 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          label="Senha"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.password2?.message}
          {...register("password2")}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
