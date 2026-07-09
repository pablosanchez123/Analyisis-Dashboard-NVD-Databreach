import { useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVendorCompare, useVendorSearch } from "@/hooks/useVendorSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { axisTickStyle, gridColor, tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "@/components/charts/chart-theme";

const COMPARE_COLORS = ["var(--series-1)", "var(--series-6)", "var(--series-2)", "var(--series-3)"];
const MAX_COMPARE = 4;

interface Selection {
  vendor: string;
  product: string;
}

function mergeTrends(entries: { vendor: string; product: string; trend: { period: string; cve_count: number }[] }[]) {
  const quarters = new Set<string>();
  entries.forEach((e) => e.trend.forEach((t) => quarters.add(t.period)));
  const sorted = Array.from(quarters).sort();
  return sorted.map((period) => {
    const row: Record<string, string | number> = { period };
    entries.forEach((e, i) => {
      const point = e.trend.find((t) => t.period === period);
      row[`s${i}`] = point ? point.cve_count : 0;
    });
    return row;
  });
}

export function VendorComparator() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);

  const search = useVendorSearch(query);
  const compare = useVendorCompare(selections);

  const isSelected = (vendor: string, product: string) =>
    selections.some((s) => s.vendor === vendor && s.product === product);

  function addSelection(vendor: string, product: string) {
    if (selections.length >= MAX_COMPARE || isSelected(vendor, product)) return;
    setSelections((prev) => [...prev, { vendor, product }]);
    setQuery("");
    setShowDropdown(false);
  }

  function removeSelection(vendor: string, product: string) {
    setSelections((prev) => prev.filter((s) => !(s.vendor === vendor && s.product === product)));
  }

  const chartData = useMemo(() => (compare.data ? mergeTrends(compare.data.data) : []), [compare.data]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{t.comparator.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.comparator.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {selections.map((s, i) => (
          <span
            key={`${s.vendor}/${s.product}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
          >
            <span className="size-2 rounded-full" style={{ background: COMPARE_COLORS[i] }} />
            {s.vendor} / {s.product}
            <button type="button" onClick={() => removeSelection(s.vendor, s.product)} aria-label={t.comparator.remove}>
              <X className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          </span>
        ))}
      </div>

      {selections.length < MAX_COMPARE && (
        <div className="relative mt-3 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            placeholder={t.comparator.placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {showDropdown && query.trim().length >= 2 && search.data && search.data.data.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
              {search.data.data.map((r) => {
                const already = isSelected(r.vendor, r.product);
                return (
                  <li key={`${r.vendor}/${r.product}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSelection(r.vendor, r.product)}
                      disabled={already}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent",
                        already && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span>
                        <span className="font-medium">{r.vendor}</span>
                        <span className="text-muted-foreground"> / {r.product}</span>
                      </span>
                      {already && <span className="text-xs text-muted-foreground">{t.comparator.alreadyAdded}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {selections.length < 2 && <p className="mt-3 text-xs text-muted-foreground">{t.comparator.needTwo}</p>}

      {selections.length >= 2 && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          {compare.isLoading && <Skeleton className="h-64 w-full" />}
          {compare.error && <p className="text-sm text-muted-foreground">{t.comparator.loadError}</p>}

          {compare.data && (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="period" tick={axisTickStyle} axisLine={{ stroke: "var(--chart-baseline)" }} tickLine={false} minTickGap={24} />
                  <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                  <Legend verticalAlign="top" height={32} iconType="plainline" wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
                  {compare.data.data.map((entry, i) => (
                    <Line
                      key={`${entry.vendor}/${entry.product}`}
                      type="monotone"
                      dataKey={`s${i}`}
                      name={`${entry.vendor} / ${entry.product}`}
                      stroke={COMPARE_COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-1.5 font-medium">{t.comparator.colVendor}</th>
                    <th className="py-1.5 font-medium">{t.comparator.colTotal}</th>
                    <th className="py-1.5 font-medium">{t.comparator.colCritical}</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.data.data.map((entry, i) => (
                    <tr key={`${entry.vendor}/${entry.product}`} className="border-b border-border last:border-0">
                      <td className="flex items-center gap-1.5 py-1.5">
                        <span className="size-2 rounded-full" style={{ background: COMPARE_COLORS[i] }} />
                        {entry.vendor} / {entry.product}
                      </td>
                      <td className="py-1.5">{entry.total_cves}</td>
                      <td className="py-1.5">{entry.critical_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
