export interface SeverityTrendPoint {
  period: string;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface SeverityTrendResponse {
  granularity: "quarter" | "month";
  data: SeverityTrendPoint[];
}

export interface TopVendorEntry {
  vendor: string;
  product: string;
  cve_count: number;
}

export interface TopVendorsResponse {
  data: TopVendorEntry[];
}

export interface PatchTimeResponse {
  avg_days_to_patch_reference: number | null;
  coverage_pct: number;
  sample_size: number;
  total_cves: number;
  caveat: string;
}

export interface CweEntry {
  cwe_id: string;
  name: string;
  cve_count: number;
}

export interface CweDistributionResponse {
  data: CweEntry[];
}

export interface ForecastPoint {
  quarter: string;
  is_history: boolean;
  in_progress: boolean;
  actual: number | null;
  predicted: number | null;
  lower: number | null;
  upper: number | null;
}

export interface ForecastResponse {
  data: ForecastPoint[];
  caveat: string;
}

export interface MetaResponse {
  total_cves: number;
  date_range_start: string | null;
  date_range_end: string | null;
  last_ingested_lastmodified: string | null;
  backfill_completed_at: string | null;
}
