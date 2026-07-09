import { CalendarClock, Database } from "lucide-react";
import { useMeta } from "@/hooks/useMetric";
import { formatDate, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";

export function DataFreshnessBanner() {
  const { data, isLoading } = useMeta();
  const { t } = useLanguage();

  if (isLoading) {
    return <Skeleton className="h-6 w-72" />;
  }

  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Database className="size-3.5" />
        {formatNumber(data.total_cves)} CVEs · {formatDate(data.date_range_start)} &ndash; {formatDate(data.date_range_end)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarClock className="size-3.5" />
        {t.freshness.lastIngested}: {formatDate(data.last_ingested_lastmodified ?? data.backfill_completed_at)}
      </span>
    </div>
  );
}
