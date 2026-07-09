import { useMemo, useState } from "react";
import { Download, FileText, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBriefing, useMeta } from "@/hooks/useMetric";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { listAvailableQuarters } from "@/lib/quarters";
import { exportBriefingToExcel } from "@/lib/exportBriefing";
import { cn } from "@/lib/utils";

export function QuarterlyBriefing() {
  const { t, language } = useLanguage();
  const meta = useMeta();
  const [selectedKey, setSelectedKey] = useState<string>(""); // "" = latest complete quarter

  const quarterOptions = useMemo(() => listAvailableQuarters(meta.data?.date_range_start), [meta.data]);
  const selection = useMemo(() => {
    if (!selectedKey) return undefined;
    const [year, quarter] = selectedKey.split("-Q").map(Number);
    return { year, quarter };
  }, [selectedKey]);

  const { data, isLoading, error } = useBriefing(selection);

  async function handleDownloadExcel() {
    if (!data) return;
    await exportBriefingToExcel(data, language);
  }

  function handleDownloadPdf() {
    window.print();
  }

  const trend: "up" | "down" | "flat" | "none" | null = !data
    ? null
    : data.pct_change_vs_previous == null
      ? "none"
      : data.pct_change_vs_previous > 1
        ? "up"
        : data.pct_change_vs_previous < -1
          ? "down"
          : "flat";

  const narrative =
    data && trend
      ? t.briefing.narrative({
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
        })
      : null;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-[var(--status-critical)]" : trend === "down" ? "text-[var(--status-good)]" : "text-muted-foreground";

  return (
    <div id="print-briefing" className="rounded-lg border border-border bg-card p-4 print:border-0 print:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--series-1)] print:size-6" />
          <div>
            <h2 className="text-base font-semibold print:text-2xl">
              {t.briefing.title} {data ? `— ${data.quarter}` : ""}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground print:text-sm">{t.briefing.subtitle}</p>
          </div>
        </div>
        <div className="no-print flex items-center gap-2">
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            aria-label={t.briefing.selectQuarter}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{quarterOptions[0]?.label ?? "…"}</option>
            {quarterOptions.slice(1).map((o) => (
              <option key={`${o.year}-Q${o.quarter}`} value={`${o.year}-Q${o.quarter}`}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            <Download className="size-3.5" />
            {t.briefing.downloadExcel}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            <FileText className="size-3.5" />
            {t.briefing.downloadPdf}
          </button>
        </div>
      </div>

      {isLoading && <Skeleton className="mt-3 h-16 w-full" />}
      {error && <p className="mt-3 text-sm text-muted-foreground">{t.briefing.loadError}</p>}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:mt-8 print:gap-6">
            <div className="rounded-md border border-border p-3 print:border-2 print:p-5">
              <p className="text-xs text-muted-foreground print:text-base">{t.briefing.kpiTotal}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums print:text-5xl">{formatNumber(data.total_cves)}</p>
            </div>
            <div className="rounded-md border border-border p-3 print:border-2 print:p-5">
              <p className="text-xs text-muted-foreground print:text-base">{t.briefing.kpiCritical}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--status-critical)] print:text-5xl">
                {formatNumber(data.critical_cves)}
              </p>
            </div>
            <div className="rounded-md border border-border p-3 print:border-2 print:p-5">
              <p className="text-xs text-muted-foreground print:text-base">{t.briefing.kpiChange}</p>
              {data.pct_change_vs_previous != null ? (
                <p className={cn("mt-1 flex items-center gap-1.5 text-2xl font-semibold tabular-nums print:text-5xl", trendColor)}>
                  <TrendIcon className="size-5 print:size-9" />
                  {Math.abs(data.pct_change_vs_previous)}%
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground print:text-2xl">{t.briefing.kpiNoChange}</p>
              )}
            </div>
          </div>

          {narrative && (
            <p className="mt-4 text-sm leading-relaxed print:mt-8 print:text-xl print:leading-relaxed">{narrative}</p>
          )}

          <p className="hidden print:mt-10 print:block print:text-xs print:text-muted-foreground">{t.briefing.printFooter}</p>
        </>
      )}
    </div>
  );
}
