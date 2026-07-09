import { Download, FileText, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBriefing } from "@/hooks/useMetric";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function QuarterlyBriefing() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useBriefing();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error || !data) return <p className="text-sm text-muted-foreground">{t.briefing.loadError}</p>;

  const trend: "up" | "down" | "flat" | "none" =
    data.pct_change_vs_previous == null
      ? "none"
      : data.pct_change_vs_previous > 1
        ? "up"
        : data.pct_change_vs_previous < -1
          ? "down"
          : "flat";

  const narrative = t.briefing.narrative({
    quarter: data.quarter,
    totalCves: formatNumber(data.total_cves),
    criticalCves: formatNumber(data.critical_cves),
    trend,
    pct: data.pct_change_vs_previous != null ? Math.abs(data.pct_change_vs_previous).toString() : "",
    previousQuarter: data.previous_quarter,
    topVendor: data.top_vendor,
    topProduct: data.top_product,
    topVendorCount: formatNumber(data.top_vendor_cve_count),
    topCweName: data.top_cwe_name,
  });

  function handleDownloadCsv() {
    if (!data) return;
    const rows = [
      ["quarter", data.quarter],
      ["previous_quarter", data.previous_quarter],
      ["total_cves", String(data.total_cves)],
      ["critical_cves", String(data.critical_cves)],
      ["pct_change_vs_previous", data.pct_change_vs_previous != null ? String(data.pct_change_vs_previous) : ""],
      ["top_vendor", data.top_vendor ?? ""],
      ["top_product", data.top_product ?? ""],
      ["top_vendor_cve_count", String(data.top_vendor_cve_count)],
      ["top_cwe_id", data.top_cwe_id ?? ""],
      ["top_cwe_name", data.top_cwe_name ?? ""],
    ];
    const csv = rows.map(([k, v]) => `${k},"${v.replace(/"/g, '""')}"`).join("\n");
    downloadBlob(`nvd-briefing-${data.quarter}.csv`, csv, "text/csv;charset=utf-8");
  }

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <div id="print-briefing" className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--series-1)]" />
          <div>
            <h2 className="text-base font-semibold">
              {t.briefing.title} — {data.quarter}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.briefing.subtitle}</p>
          </div>
        </div>
        <div className="no-print flex gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <Download className="size-3.5" />
            {t.briefing.downloadCsv}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <FileText className="size-3.5" />
            {t.briefing.downloadPdf}
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{narrative}</p>
    </div>
  );
}
