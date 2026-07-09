import { useQuery } from "@tanstack/react-query";
import { compareVendors, fetchVendorDetail, searchVendors } from "@/api/vendorSearch";
import { useDebouncedValue } from "./useDebouncedValue";

const STALE_TIME_MS = 5 * 60 * 1000;

export function useVendorSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 300);

  return useQuery({
    queryKey: ["vendor-search", debounced],
    queryFn: () => searchVendors(debounced),
    enabled: debounced.length >= 2,
    staleTime: STALE_TIME_MS,
  });
}

export function useVendorDetail(vendor: string | null, product: string | null) {
  return useQuery({
    queryKey: ["vendor-detail", vendor, product],
    queryFn: () => fetchVendorDetail(vendor!, product!),
    enabled: !!vendor && !!product,
    staleTime: STALE_TIME_MS,
  });
}

export function useVendorCompare(pairs: Array<{ vendor: string; product: string }>) {
  return useQuery({
    queryKey: ["vendor-compare", pairs],
    queryFn: () => compareVendors(pairs),
    enabled: pairs.length >= 2,
    staleTime: STALE_TIME_MS,
  });
}
