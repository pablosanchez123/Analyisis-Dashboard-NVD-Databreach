import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSeverityTrend } from "@/hooks/useMetric";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { axisTickStyle, gridColor, SEVERITY_COLORS, tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "./chart-theme";

const SEVERITY_KEYS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export function SeverityTrendChart() {
  const { data, isLoading, error } = useSeverityTrend();
  const { t } = useLanguage();

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (error || !data) return <p className="text-sm text-muted-foreground">{t.charts.loadErrorSeverity}</p>;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data.data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="period" tick={axisTickStyle} axisLine={{ stroke: "var(--chart-baseline)" }} tickLine={false} />
        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
        <Legend
          verticalAlign="top"
          height={32}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13, color: "var(--muted-foreground)" }}
        />
        {SEVERITY_KEYS.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={t.severity[key]}
            stackId="severity"
            stroke={SEVERITY_COLORS[key]}
            strokeWidth={2}
            fill={SEVERITY_COLORS[key]}
            fillOpacity={0.55}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
