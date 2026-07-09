import { useQuery } from "@tanstack/react-query";
import {
  fetchCweDistribution,
  fetchForecast,
  fetchMeta,
  fetchPatchTime,
  fetchSeverityTrend,
  fetchTopVendors,
} from "@/api/metrics";

const STALE_TIME_MS = 5 * 60 * 1000;

export const useSeverityTrend = () =>
  useQuery({ queryKey: ["severity-trend"], queryFn: fetchSeverityTrend, staleTime: STALE_TIME_MS });

export const useTopVendors = () =>
  useQuery({ queryKey: ["top-vendors"], queryFn: fetchTopVendors, staleTime: STALE_TIME_MS });

export const usePatchTime = () =>
  useQuery({ queryKey: ["patch-time"], queryFn: fetchPatchTime, staleTime: STALE_TIME_MS });

export const useCweDistribution = () =>
  useQuery({ queryKey: ["cwe-distribution"], queryFn: fetchCweDistribution, staleTime: STALE_TIME_MS });

export const useForecast = () =>
  useQuery({ queryKey: ["forecast"], queryFn: fetchForecast, staleTime: STALE_TIME_MS });

export const useMeta = () => useQuery({ queryKey: ["meta"], queryFn: fetchMeta, staleTime: STALE_TIME_MS });
