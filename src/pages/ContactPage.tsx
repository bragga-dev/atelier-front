import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { contactApi } from "@/api/endpoints/contact";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { useAuth } from "@/features/auth/auth-context";
import { contactSchema, type ContactFormValues } from "@/features/contact/schemas";

export default function ContactPage() {
  const { me } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Logado: já sugere nome e e-mail (dá para editar).
  const fullName = [me?.client?.first_name, me?.client?.last_name].filter(Boolean).join(" ");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    values: { full_name: fullName, email: me?.user.email ?? "", phone: "", subject: "", message: "" },
    resetOptions: { keepDirtyValues: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await contactApi.create(values);
      setSent(true);
    } catch (error) {
      setFormError(
        applyApiErrors(
          error,
          setError,
          ["full_name", "email", "phone", "subject", "message"],
          "Não foi possível enviar sua mensagem. Tente novamente.",
        ),
      );
    }
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <header>
          <h1 className="text-4xl font-semibold sm:text-5xl">Contato</h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">
            Dúvidas sobre uma peça, um pedido ou uma encomenda? Escreva para a gente e respondemos assim que possível.
          </p>

          <div className="mt-8 flex max-w-md items-start gap-4 rounded-md border border-sand-200 bg-white p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-parchment text-oxblood-600">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">Prefere conversar agora?</p>
              <p className="mt-1 text-sm text-ink-soft">Entre no chat com a loja e fale direto com a gente.</p>
              <Link to="/chat" className="mt-3 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-oxblood-700 hover:underline">
                Abrir chat
              </Link>
            </div>
          </div>
        </header>

        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-card sm:p-10">
          {sent ? (
            <div className="space-y-5 py-6 text-center" role="status">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-olive-50 text-olive-600">
                <CircleCheck className="size-7" aria-hidden="true" />
              </span>
              <h2 className="text-3xl font-semibold">Mensagem enviada!</h2>
              <p className="text-ink-soft">Obrigado pelo contato. Vamos responder pelo e-mail ou telefone informados.</p>
              <Link to="/" className={buttonStyles({ variant: "outline" })}>
                Voltar ao início
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {formError && <Alert tone="error">{formError}</Alert>}

              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="Nome completo" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
                <TextField
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <TextField
                  label="Telefone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(73) 99999-9999"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                <TextField label="Assunto" error={errors.subject?.message} {...register("subject")} />
              </div>

              <TextAreaField label="Mensagem" rows={6} error={errors.message?.message} {...register("message")} />

              <Button type="submit" size="lg" loading={isSubmitting}>
                Enviar mensagem
              </Button>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}