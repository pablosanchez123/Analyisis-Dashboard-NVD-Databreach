import { apiGet } from "./client";
import type {
  CweDistributionResponse,
  ForecastResponse,
  MetaResponse,
  PatchTimeResponse,
  SeverityTrendResponse,
  TopVendorsResponse,
} from "@/types/metrics";

export const fetchSeverityTrend = () => apiGet<SeverityTrendResponse>("/api/metrics/severity-trend?granularity=quarter");

export const fetchTopVendors = () => apiGet<TopVendorsResponse>("/api/metrics/top-vendors?limit=10");

export const fetchPatchTime = () => apiGet<PatchTimeResponse>("/api/metrics/patch-time");

export const fetchCweDistribution = () => apiGet<CweDistributionResponse>("/api/metrics/cwe-distribution?limit=10");

export const fetchForecast = () => apiGet<ForecastResponse>("/api/metrics/forecast");

export const fetchMeta = () => apiGet<MetaResponse>("/api/meta");
