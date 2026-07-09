import { useQuery } from "@tanstack/react-query";
import {
  fetchCweDistribution,
  fetchForecast,
  fetchMeta,
  fetchPatchTime,
  fetchSeverityTrend,
  fetchTopVendors,
} from "@/api/metrics";
import { fetchBriefing } from "@/api/briefing";
import { ALL_TIME, type DateRange } from "@/types/dateRange";

const STALE_TIME_MS = 5 * 60 * 1000;

export const useSeverityTrend = (range: DateRange = ALL_TIME) =>
  useQuery({
    queryKey: ["severity-trend", range],
    queryFn: () => fetchSeverityTrend(range),
    staleTime: STALE_TIME_MS,
  });

export const useTopVendors = (range: DateRange = ALL_TIME) =>
  useQuery({
    queryKey: ["top-vendors", range],
    queryFn: () => fetchTopVendors(range),
    staleTime: STALE_TIME_MS,
  });

export const usePatchTime = (range: DateRange = ALL_TIME) =>
  useQuery({
    queryKey: ["patch-time", range],
    queryFn: () => fetchPatchTime(range),
    staleTime: STALE_TIME_MS,
  });

export const useCweDistribution = (range: DateRange = ALL_TIME) =>
  useQuery({
    queryKey: ["cwe-distribution", range],
    queryFn: () => fetchCweDistribution(range),
    staleTime: STALE_TIME_MS,
  });

export const useForecast = () =>
  useQuery({ queryKey: ["forecast"], queryFn: fetchForecast, staleTime: STALE_TIME_MS });

export const useMeta = () => useQuery({ queryKey: ["meta"], queryFn: fetchMeta, staleTime: STALE_TIME_MS });

export const useBriefing = () =>
  useQuery({ queryKey: ["briefing"], queryFn: fetchBriefing, staleTime: STALE_TIME_MS });
