import { usePatchTime } from "@/hooks/useMetric";
import { StatTile } from "@/components/layout/StatTile";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_TIME, type DateRange } from "@/types/dateRange";

export function PatchTimeCard({ dateRange = ALL_TIME }: { dateRange?: DateRange }) {
  const { data, isLoading, error } = usePatchTime(dateRange);
  const { t, language } = useLanguage();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error || !data) return <p className="text-sm text-muted-foreground">{t.charts.loadErrorPatchTime}</p>;

  const value =
    data.avg_days_to_patch_reference != null
      ? `${Math.round(data.avg_days_to_patch_reference)} ${language === "es" ? "días" : "days"}`
      : "—";

  return (
    <StatTile
      label={t.patchTime.label}
      value={value}
      sublabel={t.patchTime.sublabel(
        String(data.coverage_pct),
        formatNumber(data.sample_size),
        formatNumber(data.total_cves),
      )}
    />
  );
}
