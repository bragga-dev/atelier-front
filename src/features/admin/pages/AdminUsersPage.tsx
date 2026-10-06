// frontend/src/features/admin/pages/AdminUsersPage.tsx
import { useState } from "react";
import { DataTable } from "@/components/panel/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { PagerButtons } from "@/components/panel/PagerButtons";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { SelectField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";
import { useAdminUsers, useUserActions } from "../hooks";

export default function AdminUsersPage() {
  const { me } = useAuth();
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [toDeactivate, setToDeactivate] = useState<{ id: string; email: string } | null>(null);
  const search = useDebouncedValue(text.trim(), 400);
  const users = useAdminUsers({ search: search || undefined, role: role || undefined, isActive: active === "" ? undefined : active === "1", page });
  const actions = useUserActions();

  return (
    <>
      <PageHeader title="Usuários" description="Clientes e administradores. Desativar impede o login sem apagar os dados." />
      <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_12rem_12rem]">
        <TextField label="Buscar" placeholder="E-mail ou nome" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
        <SelectField label="Perfil" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">Todos</option><option value="client">Clientes</option><option value="admin">Administradores</option>
        </SelectField>
        <SelectField label="Situação" value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">Todas</option><option value="1">Ativos</option><option value="0">Inativos</option>
        </SelectField>
      </div>

      {users.isPending ? <Skeleton className="h-64" /> : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} retrying={users.isFetching} />
      ) : users.data.items.length === 0 ? <p className="py-10 text-ink-soft">Nenhum usuário encontrado.</p> : (
        <>
          <DataTable caption="Usuários" rows={users.data.items} rowKey={(u) => u.user_id}
            columns={[
              { header: "Usuário", cell: (u) => (
                <span className="flex items-center gap-3"><Avatar src={safeExternalUrl(u.photo_url)} name={u.display_name || u.email} size="sm" />
                  <span className="min-w-0"><span className="block truncate font-semibold">{u.display_name || u.email}</span><span className="block truncate text-xs text-ink-soft">{u.email}</span></span></span>
              ) },
              { header: "Perfil", cell: (u) => <Badge tone={u.role === "admin" ? "info" : "neutral"}>{u.role_label ?? u.role}</Badge> },
              { header: "Desde", cell: (u) => formatDate(u.date_joined), hideOnMobile: true },
              { header: "Situação", cell: (u) => <Badge tone={u.is_active ? "success" : "danger"}>{u.is_active ? "Ativo" : "Inativo"}</Badge> },
              { header: "", className: "text-right", cell: (u) => u.user_id === me?.user.user_id ? <span className="text-xs text-ink-soft">você</span> : u.is_active ? (
                <Button variant="ghost" size="sm" onClick={() => setToDeactivate({ id: u.user_id, email: u.email })}>Desativar</Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => actions.reactivate.mutate(u.user_id)}>Reativar</Button>
              ) },
            ]} />
          <PagerButtons page={users.data.page} pages={users.data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={Boolean(toDeactivate)} title="Desativar usuário?" description={toDeactivate ? `${toDeactivate.email} não conseguirá mais entrar.` : undefined}
        confirmLabel="Desativar" loading={actions.deactivate.isPending} onCancel={() => setToDeactivate(null)}
        onConfirm={() => toDeactivate && actions.deactivate.mutate(toDeactivate.id, { onSettled: () => setToDeactivate(null) })} />
    </>
  );
}