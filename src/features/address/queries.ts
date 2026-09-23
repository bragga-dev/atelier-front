import { useQuery } from "@tanstack/react-query";
import { addressApi } from "@/api/endpoints/address";
import { queryKeys } from "@/api/query-keys";

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.address.all,
    queryFn: ({ signal }) => addressApi.list(signal),
    staleTime: 60_000,
  });
}