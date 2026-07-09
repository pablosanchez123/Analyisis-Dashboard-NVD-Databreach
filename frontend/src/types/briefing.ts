export interface BriefingResponse {
  quarter: string;
  previous_quarter: string;
  total_cves: number;
  critical_cves: number;
  pct_change_vs_previous: number | null;
  top_vendor: string | null;
  top_product: string | null;
  top_vendor_cve_count: number;
  top_cwe_id: string | null;
  top_cwe_name: string | null;
}
