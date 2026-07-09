import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTopVendors } from "@/hooks/useMetric";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_TIME, type DateRange } from "@/types/dateRange";
import { axisTickStyle, gridColor, tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "./chart-theme";

export function TopVendorsChart({ dateRange = ALL_TIME }: { dateRange?: DateRange }) {
  const { data, isLoading, error } = useTopVendors(dateRange);
  const { t } = useLanguage();

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (error || !data) return <p className="text-sm text-muted-foreground">{t.charts.loadErrorVendors}</p>;

  const chartData = data.data
    .map((d) => ({ ...d, label: `${d.vendor} / ${d.product}` }))
    .reverse(); // Recharts vertical bar renders bottom-to-top; reverse so #1 is on top

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} horizontal={false} />
        <XAxis type="number" tick={axisTickStyle} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisTickStyle}
          axisLine={{ stroke: "var(--chart-baseline)" }}
          tickLine={false}
          width={160}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          formatter={(value) => [value, t.charts.cves]}
        />
        <Bar dataKey="cve_count" name={t.charts.cves} fill="var(--seq-blue-450)" radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="cve_count" position="right" style={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
