import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { isApiError, toUserMessage } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { useAuth } from "../auth-context";
import { applyApiErrors } from "../apply-api-errors";
import { AuthShell } from "../components/AuthShell";
import { ResendVerification } from "../components/ResendVerification";
import { loginSchema, type LoginFormValues } from "../schemas";

export default function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setUnverifiedEmail(null);
    try {
      // Sucesso: o AuthProvider passa a "authenticated" e <GuestOnly> redireciona para `next`.
      await login(values);
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        // Backend: 403 no login = e-mail ainda não verificado.
        setUnverifiedEmail(values.email);
        setFormError(toUserMessage(error));
        return;
      }
      setFormError(
        applyApiErrors(error, setError, ["email", "password"], "Não foi possível entrar. Tente novamente."),
      );
    }
  });

  const nextParam = params.get("next");
  const withNext = (path: string) => (nextParam ? `${path}?next=${encodeURIComponent(nextParam)}` : path);

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar seus pedidos e finalizar suas compras."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to={withNext("/cadastro")} className="font-semibold text-oxblood-700 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <Alert tone="error">
            <p>{formError}</p>
            {unverifiedEmail && (
              <div className="mt-3">
                <ResendVerification email={unverifiedEmail} />
              </div>
            )}
          </Alert>
        )}

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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="text-right">
          <Link to="/esqueci-senha" className="text-sm font-semibold text-oxblood-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
