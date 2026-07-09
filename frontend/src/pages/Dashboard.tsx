import { useState } from "react";
import { ChartCard } from "@/components/ChartCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { VendorWatchlist } from "@/components/VendorWatchlist";
import { VendorComparator } from "@/components/VendorComparator";
import { QuarterlyBriefing } from "@/components/QuarterlyBriefing";
import { SeverityTrendChart } from "@/components/charts/SeverityTrendChart";
import { TopVendorsChart } from "@/components/charts/TopVendorsChart";
import { CweDistributionChart } from "@/components/charts/CweDistributionChart";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { PatchTimeCard } from "@/components/PatchTimeCard";
import { DataFreshnessBanner } from "@/components/layout/DataFreshnessBanner";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_TIME, type DateRange } from "@/types/dateRange";

export function Dashboard() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.dashboard.title}</h1>
        <DataFreshnessBanner />
      </div>

      <div className="mb-5">
        <QuarterlyBriefing />
      </div>

      <div className="mb-5">
        <VendorWatchlist />
      </div>

      <div className="mb-5">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title={t.dashboard.severityTitle}
          description={t.dashboard.severityDesc}
          className="lg:col-span-2"
        >
          <SeverityTrendChart dateRange={dateRange} />
        </ChartCard>

        <ChartCard title={t.dashboard.vendorsTitle} description={t.dashboard.vendorsDesc}>
          <TopVendorsChart dateRange={dateRange} />
        </ChartCard>

        <ChartCard title={t.dashboard.cweTitle} description={t.dashboard.cweDesc}>
          <CweDistributionChart dateRange={dateRange} />
        </ChartCard>

        <ChartCard
          title={t.dashboard.forecastTitle}
          description={t.dashboard.forecastDesc}
          className="lg:col-span-2"
        >
          <ForecastChart />
        </ChartCard>

        <ChartCard title={t.dashboard.patchTitle} description={t.dashboard.patchDesc}>
          <PatchTimeCard dateRange={dateRange} />
        </ChartCard>
      </div>

      <div className="mt-5">
        <VendorComparator />
      </div>
    </div>
  );
}
