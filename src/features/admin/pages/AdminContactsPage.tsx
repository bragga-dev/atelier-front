// frontend/src/features/admin/pages/AdminContactsPage.tsx
import { useState } from "react";
import { Mail, Phone, Trash2 } from "lucide-react";
import type { ContactStatus } from "@/api/types";
import { PageHeader } from "@/components/panel/PageHeader";
import { PagerButtons } from "@/components/panel/PagerButtons";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { SelectField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";
import { useAdminContacts, useContactActions } from "../hooks";

const STATUS: { value: ContactStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "resolved", label: "Resolvido" },
  { value: "archived", label: "Arquivado" },
];

export default function AdminContactsPage() {
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const search = useDebouncedValue(text.trim(), 400);
  const contacts = useAdminContacts({ status: status || undefined, search: search || undefined, page });
  const actions = useContactActions();

  return (
    <>
      <PageHeader title="Contatos" description="Mensagens enviadas pelo formulário da loja." />
      <div className="mb-4 grid gap-4 sm:max-w-2xl sm:grid-cols-[1fr_14rem]">
        <TextField label="Buscar" placeholder="Nome, e-mail ou assunto" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
        <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectField>
      </div>

      {contacts.isPending ? <Skeleton className="h-48" /> : contacts.isError ? (
        <ErrorState error={contacts.error} onRetry={() => void contacts.refetch()} retrying={contacts.isFetching} />
      ) : contacts.data.items.length === 0 ? <p className="py-10 text-ink-soft">Nenhuma mensagem.</p> : (
        <>
          <ul className="space-y-3">
            {contacts.data.items.map((c) => (
              <li key={c.contact_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.subject}</p>
                    <p className="text-sm text-ink-soft">{c.full_name} · {formatDateTime(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SelectField label="Status" aria-label={`Status de ${c.subject}`} className="h-10 text-sm" value={c.status}
                      onChange={(e) => actions.setStatus.mutate({ id: c.contact_id, status: e.target.value as ContactStatus })}>
                      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </SelectField>
                    <Button variant="ghost" size="sm" aria-label={`Excluir ${c.subject}`} onClick={() => setToDelete(c.contact_id)}><Trash2 className="size-4" aria-hidden="true" /></Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 font-semibold text-oxblood-700 hover:underline"><Mail className="size-4" aria-hidden="true" />{c.email}</a>
                  {c.phone && <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 font-semibold text-oxblood-700 hover:underline"><Phone className="size-4" aria-hidden="true" />{c.phone}</a>}
                  {safeExternalUrl(`https://wa.me/55${c.phone.replace(/\D/g, "")}`) && c.phone && (
                    <a href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="font-semibold text-oxblood-700 hover:underline">WhatsApp</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PagerButtons page={contacts.data.page} pages={contacts.data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Excluir mensagem?" description="A exclusão é permanente." confirmLabel="Excluir"
        loading={actions.remove.isPending} onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && actions.remove.mutate(toDelete, { onSettled: () => setToDelete(null) })} />
    </>
  );
}