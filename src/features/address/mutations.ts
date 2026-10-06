// frontend/src/features/address/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesApi } from "@/api/endpoints/addresses";
import { queryKeys } from "@/api/query-keys";
import type { AddressOut, AddressUpdateIn } from "@/api/types";
import { toast } from "@/lib/toast";

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.create,
    onSuccess: (created) => {
      // O backend torna o novo endereço o preferencial (e desmarca os outros) — reflete no cache.
      queryClient.setQueryData<AddressOut[]>(queryKeys.addresses.list, (current = []) => [
        created,
        ...current.map((address) => ({ ...address, is_preferential: false })),
      ]);
    },
    meta: { errorToast: false },
  });
}

export function useUpdateAddress(addressId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddressUpdateIn) => addressesApi.update(addressId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<AddressOut[]>(queryKeys.addresses.list, (current = []) =>
        current.map((address) => (address.address_id === updated.address_id ? updated : address)),
      );
    },
    meta: { errorToast: false },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => addressesApi.remove(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.addresses.list });
      toast.success("Endereço removido.");
    },
  });
}

export function useSetPreferentialAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => addressesApi.setPreferential(addressId),
    onSuccess: (updated) => {
      queryClient.setQueryData<AddressOut[]>(queryKeys.addresses.list, (current = []) =>
        current.map((address) => ({ ...address, is_preferential: address.address_id === updated.address_id })),
      );
      toast.success("Endereço preferencial atualizado.");
    },
  });
}