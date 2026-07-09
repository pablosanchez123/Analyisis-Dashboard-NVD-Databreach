import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBreaches } from "@/api/breaches";
import { computeBreachStats } from "@/lib/breachStats";

// HIBP's breach catalog changes a few times a week at most — cache hard.
const STALE_TIME_MS = 24 * 60 * 60 * 1000;

export function useBreaches() {
  const query = useQuery({
    queryKey: ["hibp-breaches"],
    queryFn: fetchBreaches,
    staleTime: STALE_TIME_MS,
    gcTime: STALE_TIME_MS,
  });

  const stats = useMemo(() => (query.data ? computeBreachStats(query.data) : null), [query.data]);

  return { ...query, stats };
}
