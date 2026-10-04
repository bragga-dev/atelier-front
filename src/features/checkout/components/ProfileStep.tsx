import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ClientProfileOut } from "@/api/types";
import { isApiError } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { formatCpf, maskCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/mask";
import { useUpdateClientProfile } from "../mutations";
import { profileSchema, type ProfileFormValues } from "../schemas";
import { StepCard } from "./StepCard";

/** O checkout exige nome, sobrenome e CPF no perfil (regra do backend: `ClientCompleteProfileAuth`). */
export function isProfileComplete(client: ClientProfileOut | null | undefined): boolean {
  return Boolean(client?.first_name?.trim() && client?.last_name?.trim() && client?.cpf);
}

export function ProfileStep({ client }: { client: ClientProfileOut | null | undefined }) {
  const complete = isProfileComplete(client);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const update = useUpdateClientProfile();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: client?.first_name ?? "",
      last_name: client?.last_name ?? "",
      cpf: client?.cpf ? formatCpf(client.cpf) : "",
      phone: client?.phone ? formatPhone(client.phone) : "",
    },
  });

  const open = !complete || editing;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        cpf: values.cpf.replace(/\D/g, ""),
        // Vazio = não enviar (o backend valida o telefone quando ele vem preenchido).
        ...(values.phone ? { phone: values.phone } : {}),
      });
      setEditing(false);
    } catch (error) {
      // O backend responde 400 com uma frase única (ex.: CPF inválido ou já cadastrado em outra conta).
      if (isApiError(error) && error.status === 400 && /cpf/i.test(error.detail ?? "")) {
        setError("cpf", { type: "server", message: error.detail ?? "CPF inválido." });
        return;
      }
      setFormError(applyApiErrors(error, setError, ["first_name", "last_name", "cpf", "phone"], "Não foi possível salvar seus dados."));
    }
  });

  return (
    <StepCard
      number={1}
      title="Seus dados"
      done={complete && !editing}
      action={
        complete && !editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Alterar
          </Button>
        ) : undefined
      }
    >
      {open ? (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {!complete && (
            <p className="text-sm text-ink-soft">
              Precisamos do seu nome e CPF para emitir o pedido e a cobrança. Você só preenche isso uma vez.
            </p>
          )}
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nome" autoComplete="given-name" error={errors.first_name?.message} {...register("first_name")} />
            <TextField label="Sobrenome" autoComplete="family-name" error={errors.last_name?.message} {...register("last_name")} />
            <TextField
              label="CPF"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              error={errors.cpf?.message}
              {...register("cpf", { onChange: (event) => (event.target.value = formatCpf(event.target.value)) })}
            />
            <TextField
              label="Telefone (opcional)"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(73) 99999-9999"
              error={errors.phone?.message}
              {...register("phone", { onChange: (event) => (event.target.value = formatPhone(event.target.value)) })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={update.isPending}>
              Salvar dados
            </Button>
            {complete && (
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-ink-soft">
          <span className="font-semibold text-ink">
            {client?.first_name} {client?.last_name}
          </span>{" "}
          · CPF {maskCpf(client?.cpf ?? "")}
        </p>
      )}
    </StepCard>
  );
}