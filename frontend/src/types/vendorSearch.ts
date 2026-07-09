export interface VendorSearchEntry {
  vendor: string;
  product: string;
  cve_count: number;
  critical_count: number;
}

export interface VendorSearchResponse {
  data: VendorSearchEntry[];
}

export interface VendorTrendPoint {
  period: string;
  cve_count: number;
}

export interface VendorRecentCve {
  cve_id: string;
  published_date: string;
  cvss_severity: string | null;
  cvss_score: number | null;
  description: string;
  has_exploit_reference: boolean;
}

export interface VendorDetailResponse {
  vendor: string;
  product: string;
  total_cves: number;
  critical_count: number;
  critical_pct: number;
  trend: VendorTrendPoint[];
  recent_cves: VendorRecentCve[];
}

export interface VendorCompareResponse {
  data: VendorDetailResponse[];
}
