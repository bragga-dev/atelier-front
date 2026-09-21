import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { authApi } from "@/api/endpoints/auth";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { applyApiErrors } from "../apply-api-errors";
import { AuthShell } from "../components/AuthShell";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // O backend responde sempre 200 (não revela se o e-mail existe).
      const response = await authApi.requestPasswordReset(values);
      setSentMessage(response.detail);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["email"]));
    }
  });

  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/entrar" className="font-semibold text-oxblood-700 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sentMessage ? (
        <Alert tone="success">{sentMessage}</Alert>
      ) : (
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
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
