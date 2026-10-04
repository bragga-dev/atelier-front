import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import type { AddressOut } from "@/api/types";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { useAddresses } from "../queries";
import { AddressForm } from "./AddressForm";
import { StepCard } from "./StepCard";

interface AddressStepProps {
  locked: boolean;
  selectedId: string | null;
  onSelect: (address: AddressOut) => void;
}

export function AddressStep({ locked, selectedId, onSelect }: AddressStepProps) {
  const addresses = useAddresses();
  const [adding, setAdding] = useState(false);
  const items = addresses.data ?? [];

  const done = !locked && Boolean(selectedId) && !adding;
  // Sem nenhum endereço cadastrado, o formulário já abre (não há o que escolher).
  const showForm = adding || (!addresses.isPending && !addresses.isError && items.length === 0);

  return (
    <StepCard number={2} title="Endereço de entrega" locked={locked} done={done}>
      {addresses.isPending ? (
        <div className="space-y-3" aria-busy="true" aria-label="Carregando endereços">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : addresses.isError ? (
        <ErrorState
          className="py-4"
          error={addresses.error}
          title="Não foi possível carregar seus endereços"
          onRetry={() => void addresses.refetch()}
          retrying={addresses.isFetching}
        />
      ) : showForm ? (
        <AddressForm
          onCreated={(created) => {
            onSelect(created);
            setAdding(false);
          }}
          onCancel={items.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : (
        <>
          <fieldset>
            <legend className="sr-only">Escolha o endereço de entrega</legend>
            <ul className="space-y-3">
              {items.map((address) => {
                const checked = address.address_id === selectedId;
                return (
                  <li key={address.address_id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        checked ? "border-oxblood-600 bg-oxblood-50/50" : "border-sand-200 hover:border-ink/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="endereco"
                        checked={checked}
                        onChange={() => onSelect(address)}
                        className="mt-1 size-4 accent-oxblood-600"
                      />
                      <MapPin className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                      <span className="min-w-0 text-sm">
                        <span className="block font-semibold text-ink">
                          {address.street}, {address.number}
                          {address.complement ? ` — ${address.complement}` : ""}
                        </span>
                        <span className="block text-ink-soft">
                          {address.neighborhood} · {address.city}/{address.state} · CEP {address.cep}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Usar outro endereço
          </Button>
        </>
      )}
    </StepCard>
  );
}