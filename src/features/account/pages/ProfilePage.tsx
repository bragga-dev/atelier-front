import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isApiError } from "@/api/errors";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { useAuth } from "@/features/auth/auth-context";
import { isAdminUser } from "@/features/auth/display-name";
import { useUpdateClientProfile } from "@/features/checkout/mutations";
import { formatCpf } from "@/lib/cpf";
import { formatPhone } from "@/lib/mask";
import { toast } from "@/lib/toast";
import { PhotoUploader } from "../components/PhotoUploader";
import { useUpdateAdminProfile } from "../hooks";
import {
  adminProfileSchema,
  clientProfileSchema,
  type AdminProfileFormValues,
  type ClientProfileFormValues,
} from "../schemas";

function ClientProfileForm() {
  const { me } = useAuth();
  const client = me?.client;
  const update = useUpdateClientProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<ClientProfileFormValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      first_name: client?.first_name ?? "",
      last_name: client?.last_name ?? "",
      cpf: client?.cpf ? formatCpf(client.cpf) : "",
      phone: client?.phone ? formatPhone(client.phone) : "",
      birth_date: client?.birth_date ?? "",
      gender: (client?.gender as ClientProfileFormValues["gender"]) ?? "Outro",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        // Campos vazios não são enviados (o backend valida CPF/telefone/data só quando vêm preenchidos).
        ...(values.cpf ? { cpf: values.cpf.replace(/\D/g, "") } : {}),
        ...(values.phone ? { phone: values.phone } : {}),
        ...(values.birth_date ? { birth_date: values.birth_date } : {}),
      });
      toast.success("Perfil atualizado.");
    } catch (error) {
      if (isApiError(error) && error.status === 400 && /cpf/i.test(error.detail ?? "")) {
        setError("cpf", { type: "server", message: error.detail ?? "CPF inválido." });
        return;
      }
      setFormError(applyApiErrors(error, setError, ["first_name", "last_name", "cpf", "phone", "birth_date", "gender"], "Não foi possível salvar seu perfil."));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nome" autoComplete="given-name" error={errors.first_name?.message} {...register("first_name")} />
        <TextField label="Sobrenome" autoComplete="family-name" error={errors.last_name?.message} {...register("last_name")} />
        <TextField label="CPF" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" error={errors.cpf?.message}
          {...register("cpf", { onChange: (e) => (e.target.value = formatCpf(e.target.value)) })} />
        <TextField label="Telefone" type="tel" autoComplete="tel" placeholder="(73) 99999-9999" error={errors.phone?.message}
          {...register("phone", { onChange: (e) => (e.target.value = formatPhone(e.target.value)) })} />
        <TextField label="Data de nascimento" type="date" autoComplete="bday" error={errors.birth_date?.message} {...register("birth_date")} />
        <SelectField label="Gênero" {...register("gender")}>
          <option value="Feminino">Feminino</option>
          <option value="Masculino">Masculino</option>
          <option value="Outro">Outro / prefiro não informar</option>
        </SelectField>
      </div>
      <TextField label="E-mail" value={me?.user.email ?? ""} readOnly disabled hint="O e-mail da conta não pode ser alterado aqui." />
      <Button type="submit" loading={update.isPending}>Salvar alterações</Button>
    </form>
  );
}

function AdminProfileForm() {
  const { me } = useAuth();
  const update = useUpdateAdminProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: { full_name: me?.admin?.full_name ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync(values);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["full_name"], "Não foi possível salvar seu perfil."));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField label="Nome completo" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
      <TextField label="E-mail" value={me?.user.email ?? ""} readOnly disabled />
      <Button type="submit" loading={update.isPending}>Salvar alterações</Button>
    </form>
  );
}

/** Perfil compartilhado: cliente edita dados pessoais; admin edita o nome. Ambos trocam a foto. */
export default function ProfilePage() {
  const { me } = useAuth();
  const admin = isAdminUser(me);

  return (
    <>
      <PageHeader title="Meu perfil" description="Seus dados e a foto que aparece no menu e no chat." />
      <div className="space-y-6">
        <Section title="Foto"><PhotoUploader /></Section>
        <Section title="Dados pessoais">{admin ? <AdminProfileForm /> : <ClientProfileForm />}</Section>
      </div>
    </>
  );
}