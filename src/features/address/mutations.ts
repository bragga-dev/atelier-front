import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "@/api/endpoints/address";
import { queryKeys } from "@/api/query-keys";
import type { AddressOut } from "@/api/types";

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.create,
    onSuccess: (address) => {
      queryClient.setQueryData<AddressOut[]>(queryKeys.address.all, (current) => [...(current ?? []), address]);
    },
  });
}