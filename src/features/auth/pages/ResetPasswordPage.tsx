import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { authApi } from "@/api/endpoints/auth";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { PasswordField } from "@/components/ui/Field";
import { applyApiErrors } from "../apply-api-errors";
import { AuthShell } from "../components/AuthShell";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas";

/** Destino do link do e-mail: /redefinir-senha?uid=…&token=… (formato definido pelo backend). */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", new_password2: "" },
  });

  if (!uid || !token) {
    return (
      <AuthShell title="Link inválido" subtitle="Esse link de redefinição está incompleto ou expirou.">
        <Link to="/esqueci-senha" className={buttonStyles({ fullWidth: true, size: "lg" })}>
          Pedir um novo link
        </Link>
      </AuthShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.confirmPasswordReset({ uid, token, ...values });
      setDone(true);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["new_password", "new_password2"]));
    }
  });

  if (done) {
    return (
      <AuthShell title="Senha redefinida!" subtitle="Agora é só entrar com a nova senha.">
        <Link to="/entrar" className={buttonStyles({ fullWidth: true, size: "lg" })}>
          Ir para o login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie uma nova senha"
      footer={
        <Link to="/esqueci-senha" className="font-semibold text-oxblood-700 hover:underline">
          Pedir um novo link
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.new_password?.message}
          {...register("new_password")}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.new_password2?.message}
          {...register("new_password2")}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Redefinir senha
        </Button>
      </form>
    </AuthShell>
  );
}
