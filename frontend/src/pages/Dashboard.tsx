import { ChartCard } from "@/components/ChartCard";
import { SeverityTrendChart } from "@/components/charts/SeverityTrendChart";
import { TopVendorsChart } from "@/components/charts/TopVendorsChart";
import { CweDistributionChart } from "@/components/charts/CweDistributionChart";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { PatchTimeCard } from "@/components/PatchTimeCard";
import { DataFreshnessBanner } from "@/components/layout/DataFreshnessBanner";
import { useLanguage } from "@/i18n/LanguageContext";

export function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.dashboard.title}</h1>
        <DataFreshnessBanner />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title={t.dashboard.severityTitle} description={t.dashboard.severityDesc} className="lg:col-span-2">
          <SeverityTrendChart />
        </ChartCard>

        <ChartCard title={t.dashboard.vendorsTitle} description={t.dashboard.vendorsDesc}>
          <TopVendorsChart />
        </ChartCard>

        <ChartCard title={t.dashboard.cweTitle} description={t.dashboard.cweDesc}>
          <CweDistributionChart />
        </ChartCard>

        <ChartCard title={t.dashboard.forecastTitle} description={t.dashboard.forecastDesc} className="lg:col-span-2">
          <ForecastChart />
        </ChartCard>

        <ChartCard title={t.dashboard.patchTitle} description={t.dashboard.patchDesc}>
          <PatchTimeCard />
        </ChartCard>
      </div>
    </div>
  );
}
