import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { AddressOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAddresses } from "../queries";
import { AddressCard } from "./AddressCard";
import { AddressForm } from "./AddressForm";

interface AddressPickerProps {
  selectedId: string | null;
  onSelect: (address: AddressOut) => void;
}

export function AddressPicker({ selectedId, onSelect }: AddressPickerProps) {
  const addresses = useAddresses();
  const [showForm, setShowForm] = useState(false);

  // Assim que a lista carrega, se nada foi escolhido ainda, pré-seleciona o preferencial (ou o primeiro).
  useEffect(() => {
    if (!addresses.data || selectedId) return;
    const preferred = addresses.data.find((a) => a.is_preferential) ?? addresses.data[0];
    if (preferred) onSelect(preferred);
    else setShowForm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.data]);

  if (addresses.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (addresses.isError) {
    return <ErrorState error={addresses.error} onRetry={() => void addresses.refetch()} retrying={addresses.isFetching} />;
  }

  return (
    <div className="space-y-3">
      {addresses.data.map((address) => (
        <AddressCard
          key={address.address_id}
          address={address}
          selected={selectedId === address.address_id}
          onSelect={() => onSelect(address)}
        />
      ))}

      {showForm ? (
        <AddressForm
          onCreated={(address) => {
            onSelect(address);
            setShowForm(false);
          }}
          onCancel={addresses.data.length > 0 ? () => setShowForm(false) : undefined}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Novo endereço
        </Button>
      )}
    </div>
  );
}