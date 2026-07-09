import { apiGet } from "./client";
import { dateRangeToQuery, type DateRange } from "@/types/dateRange";
import type {
  CweDistributionResponse,
  ForecastResponse,
  MetaResponse,
  PatchTimeResponse,
  SeverityTrendResponse,
  TopVendorsResponse,
} from "@/types/metrics";

export const fetchSeverityTrend = (range: DateRange) =>
  apiGet<SeverityTrendResponse>(`/api/metrics/severity-trend?granularity=quarter${dateRangeToQuery(range)}`);

export const fetchTopVendors = (range: DateRange) =>
  apiGet<TopVendorsResponse>(`/api/metrics/top-vendors?limit=10${dateRangeToQuery(range)}`);

export const fetchPatchTime = (range: DateRange) =>
  apiGet<PatchTimeResponse>(`/api/metrics/patch-time?${dateRangeToQuery(range).replace(/^&/, "")}`);

export const fetchCweDistribution = (range: DateRange) =>
  apiGet<CweDistributionResponse>(`/api/metrics/cwe-distribution?limit=10${dateRangeToQuery(range)}`);

export const fetchForecast = () => apiGet<ForecastResponse>("/api/metrics/forecast");

export const fetchMeta = () => apiGet<MetaResponse>("/api/meta");
