import { useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink, Search, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVendorDetail, useVendorSearch } from "@/hooks/useVendorSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";
import { axisTickStyle, gridColor, SEVERITY_COLORS, tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "@/components/charts/chart-theme";
import type { Translations } from "@/i18n/translations";

interface Selected {
  vendor: string;
  product: string;
}

function SeverityBadge({ severity, t }: { severity: string | null; t: Translations }) {
  if (!severity || !(severity in SEVERITY_COLORS)) return <span className="text-muted-foreground">—</span>;
  const key = severity as keyof typeof SEVERITY_COLORS;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="size-2 rounded-full" style={{ background: SEVERITY_COLORS[key] }} />
      {t.severity[key]}
    </span>
  );
}

export function VendorWatchlist() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useVendorSearch(query);
  const detail = useVendorDetail(selected?.vendor ?? null, selected?.product ?? null);

  function selectResult(vendor: string, product: string) {
    setSelected({ vendor, product });
    setQuery(`${vendor} / ${product}`);
    setShowDropdown(false);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{t.watchlist.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.watchlist.description}</p>

      <div className="relative mt-4 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={t.watchlist.placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t.watchlist.clear}
          >
            <X className="size-4" />
          </button>
        )}

        <AnimatePresence>
          {showDropdown && query.trim().length > 0 && !selected && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg"
            >
              {query.trim().length < 2 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">{t.watchlist.minChars}</p>
              ) : search.isLoading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">{t.watchlist.searching}</p>
              ) : !search.data || search.data.data.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">{t.watchlist.noResults}</p>
              ) : (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {search.data.data.map((r) => (
                    <li key={`${r.vendor}/${r.product}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectResult(r.vendor, r.product)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span className="truncate">
                          <span className="font-medium">{r.vendor}</span>
                          <span className="text-muted-foreground"> / {r.product}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t.watchlist.resultCves(r.cve_count)}
                          {r.critical_count > 0 && (
                            <span className="ml-1.5 text-[var(--status-critical)]">
                              · {t.watchlist.resultCritical(r.critical_count)}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 border-t border-border pt-5"
        >
          {detail.isLoading && <Skeleton className="h-64 w-full" />}

          {detail.error && <p className="text-sm text-muted-foreground">{t.watchlist.loadError}</p>}

          {detail.data && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t.watchlist.totalCves}</p>
                  <p className="mt-0.5 text-2xl font-semibold">{formatNumber(detail.data.total_cves)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.watchlist.criticalPct}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-2xl font-semibold",
                      detail.data.critical_pct > 0 && "text-[var(--status-critical)]",
                    )}
                  >
                    {detail.data.critical_pct}%
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t.watchlist.trendTitle}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={detail.data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="0" vertical={false} />
                    <XAxis dataKey="period" tick={axisTickStyle} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                    <Area
                      type="monotone"
                      dataKey="cve_count"
                      name={t.charts.cves}
                      stroke="var(--seq-blue-450)"
                      strokeWidth={2}
                      fill="var(--seq-blue-450)"
                      fillOpacity={0.15}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t.watchlist.recentTitle}</p>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">{t.watchlist.colCve}</th>
                        <th className="px-3 py-2 font-medium">{t.watchlist.colDate}</th>
                        <th className="px-3 py-2 font-medium">{t.watchlist.colSeverity}</th>
                        <th className="px-3 py-2 font-medium">{t.watchlist.colCvss}</th>
                        <th className="px-3 py-2 font-medium">{t.watchlist.colExploit}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.data.recent_cves.map((cve) => (
                        <tr key={cve.cve_id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">
                            <a
                              href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                            >
                              {cve.cve_id}
                              <ExternalLink className="size-3" />
                            </a>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDate(cve.published_date)}</td>
                          <td className="px-3 py-2">
                            <SeverityBadge severity={cve.cvss_severity} t={t} />
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{cve.cvss_score ?? "—"}</td>
                          <td className="px-3 py-2">
                            {cve.has_exploit_reference && (
                              <Badge className="gap-1 bg-[var(--status-critical)] text-white hover:bg-[var(--status-critical)]">
                                <ShieldAlert className="size-3" />
                                {t.watchlist.exploitAvailable}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
