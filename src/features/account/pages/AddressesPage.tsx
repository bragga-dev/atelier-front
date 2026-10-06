import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { AddressOut } from "@/api/types";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddressForm } from "@/features/address/components/AddressForm";
import { useDeleteAddress, useSetPreferentialAddress } from "@/features/address/mutations";
import { useAddresses } from "@/features/address/queries";

export default function AddressesPage() {
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const setPreferential = useSetPreferentialAddress();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AddressOut | null>(null);
  const items = addresses.data ?? [];

  return (
    <>
      <PageHeader
        title="Meus endereços"
        description="Usados no checkout para calcular o frete e entregar suas peças."
        actions={!adding && <Button onClick={() => { setAdding(true); setEditingId(null); }}><Plus className="size-4" aria-hidden="true" />Novo endereço</Button>}
      />

      {adding && (
        <Section title="Novo endereço" className="mb-6">
          <AddressForm onCreated={() => setAdding(false)} onCancel={() => setAdding(false)} />
        </Section>
      )}

      {addresses.isPending ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : addresses.isError ? (
        <ErrorState error={addresses.error} onRetry={() => void addresses.refetch()} retrying={addresses.isFetching} />
      ) : items.length === 0 && !adding ? (
        <EmptyState icon={<MapPin className="size-7" aria-hidden="true" />} title="Nenhum endereço cadastrado" description="Cadastre um para finalizar suas compras." />
      ) : (
        <ul className="space-y-3">
          {items.map((address) => (
            <li key={address.address_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-5">
              {editingId === address.address_id ? (
                <AddressForm address={address} onCreated={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                    <div className="text-sm">
                      <p className="font-semibold">
                        {address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ""}
                        {address.is_preferential && <Badge tone="success" className="ml-2">Preferencial</Badge>}
                      </p>
                      <p className="text-ink-soft">{address.neighborhood} · {address.city}/{address.state} · CEP {address.cep}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.is_preferential && (
                      <Button variant="outline" size="sm" onClick={() => setPreferential.mutate(address.address_id)} loading={setPreferential.isPending && setPreferential.variables === address.address_id}>
                        <Star className="size-4" aria-hidden="true" />Tornar preferencial
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(address.address_id); setAdding(false); }} aria-label={`Editar endereço ${address.street}`}>
                      <Pencil className="size-4" aria-hidden="true" />Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(address)} aria-label={`Excluir endereço ${address.street}`}>
                      <Trash2 className="size-4" aria-hidden="true" />Excluir
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir este endereço?"
        description={toDelete ? `${toDelete.street}, ${toDelete.number} — ${toDelete.city}/${toDelete.state}` : undefined}
        confirmLabel="Excluir"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.address_id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}