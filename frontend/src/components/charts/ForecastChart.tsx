import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useForecast } from "@/hooks/useMetric";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { axisTickStyle, gridColor, tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "./chart-theme";

interface TooltipEntry {
  name?: string;
  value?: number | null;
  color?: string;
}

function ForecastTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload) return null;
  // Hide the confidence-interval helper series and any null entry (e.g. "Forecast"
  // on a quarter that only has an actual value) so the tooltip only ever shows
  // data that genuinely exists for that quarter. Where the forecast line is
  // anchored to the last real point (same value as "Actual"), only show the
  // authoritative "Actual" entry — the anchor is a rendering detail, not a
  // second real value for that quarter.
  const seen = new Set<number>();
  const visible = payload.filter((entry) => {
    if (entry.value == null || !entry.name) return false;
    if (seen.has(entry.value)) return false;
    seen.add(entry.value);
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div style={tooltipContentStyle}>
      <p style={tooltipLabelStyle}>{label}</p>
      {visible.map((entry) => (
        <p key={entry.name} style={{ ...tooltipItemStyle, color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? Math.round(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function ForecastChart() {
  const { data, isLoading, error } = useForecast();
  const { t } = useLanguage();

  const chartData = useMemo(() => {
    if (!data) return [];
    // The in-progress quarter's "actual" count is a partial total (however many
    // days have elapsed so far) — plotting it on the same line as complete
    // quarters reads as a cliff-drop at the end of the trend. Pull it out into
    // its own field and mark it with a distinct, clearly-labeled point instead.
    const rows = data.data.map((d) => ({
      quarter: d.quarter,
      actual: d.in_progress ? null : d.actual,
      predicted: d.predicted,
      inProgress: d.in_progress,
      rangeBase: d.lower,
      rangeDelta: d.lower != null && d.upper != null ? d.upper - d.lower : null,
    }));

    // Anchor the forecast line to the last *complete* quarter (not the
    // in-progress one) so it reads as one continuous trend across the gap,
    // then let connectNulls skip the in-progress quarter's empty "predicted"
    // cell to jump straight to the first real forecast point.
    const lastCompleteIndex = rows.map((r) => r.actual != null).lastIndexOf(true);
    if (lastCompleteIndex !== -1) {
      rows[lastCompleteIndex] = { ...rows[lastCompleteIndex], predicted: rows[lastCompleteIndex].actual };
    }
    return rows;
  }, [data]);

  const inProgressPoint = data?.data.find((d) => d.in_progress);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (error || !data) return <p className="text-sm text-muted-foreground">{t.charts.loadErrorForecast}</p>;
  if (data.data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.charts.forecastNotReady}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="quarter" tick={axisTickStyle} axisLine={{ stroke: "var(--chart-baseline)" }} tickLine={false} minTickGap={24} />
        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<ForecastTooltip />} />
        <Legend verticalAlign="top" height={32} iconType="plainline" wrapperStyle={{ fontSize: 13, color: "var(--muted-foreground)" }} />
        {inProgressPoint && (
          <ReferenceLine x={inProgressPoint.quarter} stroke="var(--chart-baseline)" strokeDasharray="3 3" />
        )}
        <Area dataKey="rangeBase" stackId="range" stroke="none" fill="transparent" legendType="none" tooltipType="none" />
        <Area
          dataKey="rangeDelta"
          stackId="range"
          name={t.charts.confidenceInterval}
          stroke="none"
          fill="var(--series-1)"
          fillOpacity={0.15}
        />
        <Line dataKey="actual" name={t.charts.actual} stroke="var(--series-1)" strokeWidth={2} dot={false} connectNulls={false} />
        <Line
          dataKey="predicted"
          name={t.charts.forecast}
          stroke="var(--series-1)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
        />
        {inProgressPoint && inProgressPoint.actual != null && (
          <ReferenceDot
            x={inProgressPoint.quarter}
            y={inProgressPoint.actual}
            r={4}
            fill="var(--card)"
            stroke="var(--chart-muted)"
            strokeWidth={2}
            ifOverflow="visible"
            label={{ value: t.charts.inProgress, position: "top", fontSize: 11, fill: "var(--chart-muted)" }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
