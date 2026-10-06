import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, LogOut, MonitorSmartphone, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { accountApi } from "@/api/endpoints/account";
import { isApiError, toUserMessage } from "@/api/errors";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PasswordField } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useChangePassword, useDeleteAccount, useLogoutAll, useRevokeSession, useSessions } from "../hooks";
import { changePasswordSchema, type ChangePasswordFormValues } from "../schemas";

function ChangePasswordForm() {
  const change = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: "", new_password: "", new_password2: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await change.mutateAsync(values);
      reset();
    } catch (error) {
      if (isApiError(error) && error.status === 400 && !Object.keys(error.fieldErrors).length) {
        setError("old_password", { type: "server", message: error.detail ?? "Senha atual incorreta." });
        return;
      }
      setFormError(applyApiErrors(error, setError, ["old_password", "new_password", "new_password2"], "Não foi possível alterar a senha."));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <PasswordField label="Senha atual" autoComplete="current-password" error={errors.old_password?.message} {...register("old_password")} />
      <PasswordField label="Nova senha" autoComplete="new-password" hint="Mínimo de 8 caracteres, não só números." error={errors.new_password?.message} {...register("new_password")} />
      <PasswordField label="Confirmar nova senha" autoComplete="new-password" error={errors.new_password2?.message} {...register("new_password2")} />
      <Button type="submit" loading={change.isPending}>Alterar senha</Button>
    </form>
  );
}

function Sessions() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();

  if (sessions.isPending) return <Skeleton className="h-24" />;
  if (sessions.isError) return <ErrorState className="py-4" error={sessions.error} onRetry={() => void sessions.refetch()} retrying={sessions.isFetching} />;

  return (
    <>
      <ul className="divide-y divide-sand-200">
        {sessions.data.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 text-sm">
              <MonitorSmartphone className="size-5 text-ink-soft" aria-hidden="true" />
              <div>
                <p className="font-semibold">{session.device || "Dispositivo desconhecido"}</p>
                <p className="text-xs text-ink-soft">
                  {session.created_at ? `Iniciada em ${formatDateTime(session.created_at)} · ` : ""}expira em {formatDateTime(session.expires_at)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => revoke.mutate(session.id)} loading={revoke.isPending && revoke.variables === session.id}>
              Encerrar
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}>
        <LogOut className="size-4" aria-hidden="true" />
        Sair de todos os dispositivos
      </Button>
    </>
  );
}

function DataAndDeletion() {
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const del = useDeleteAccount();

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await accountApi.exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(toUserMessage(error, "Não foi possível exportar seus dados."));
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    setDeleteError(null);
    del.mutate({ password }, { onError: (e) => setDeleteError(toUserMessage(e, "Não foi possível excluir a conta.")) });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-soft">Baixe uma cópia dos seus dados pessoais armazenados na loja (LGPD).</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={exportData} loading={exporting}>
          <Download className="size-4" aria-hidden="true" />Exportar meus dados
        </Button>
      </div>
      <div className="border-t border-sand-200 pt-5">
        <p className="text-sm text-ink-soft">Excluir a conta é permanente. Seus dados pessoais serão removidos conforme a política da loja.</p>
        <Button variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:border-red-600" onClick={() => { setConfirming(true); setPassword(""); setDeleteError(null); }}>
          <Trash2 className="size-4" aria-hidden="true" />Excluir minha conta
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Excluir sua conta?"
        description="Digite sua senha para confirmar. Esta ação não pode ser desfeita."
        confirmLabel="Excluir definitivamente"
        loading={del.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
      >
        <div className="mt-3 space-y-2">
          <PasswordField label="Senha" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {deleteError && <Alert tone="error">{deleteError}</Alert>}
        </div>
      </ConfirmDialog>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <>
      <PageHeader title="Segurança" description="Senha, dispositivos conectados e seus dados." />
      <div className="space-y-6">
        <Section title="Alterar senha"><ChangePasswordForm /></Section>
        <Section title="Dispositivos conectados" description="Encerre sessões que você não reconhece."><Sessions /></Section>
        <Section title="Seus dados"><DataAndDeletion /></Section>
      </div>
    </>
  );
}