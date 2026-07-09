import type { Breach } from "@/types/breaches";

export interface BreachStats {
  totalBreaches: number;
  totalAccounts: number;
  biggest: Breach[];
  byYear: { year: string; count: number; accounts: number }[];
  topDataClasses: { name: string; count: number; pct: number }[];
  /** Breaches with a real company logo (not HIBP's generic placeholders). */
  withRealLogo: Breach[];
  newestFirst: Breach[];
}

const GENERIC_LOGOS = new Set(["List.png", "Email.png"]);

function hasRealLogo(b: Breach): boolean {
  const file = b.LogoPath.split("/").pop() ?? "";
  return !GENERIC_LOGOS.has(file);
}

export function computeBreachStats(breaches: Breach[]): BreachStats {
  const totalAccounts = breaches.reduce((sum, b) => sum + b.PwnCount, 0);

  const biggest = [...breaches].sort((a, b) => b.PwnCount - a.PwnCount).slice(0, 5);

  const yearMap = new Map<string, { count: number; accounts: number }>();
  for (const b of breaches) {
    const year = b.BreachDate.slice(0, 4);
    const entry = yearMap.get(year) ?? { count: 0, accounts: 0 };
    entry.count += 1;
    entry.accounts += b.PwnCount;
    yearMap.set(year, entry);
  }
  const byYear = Array.from(yearMap.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year))
    // The long pre-2010 tail is a handful of retro-added breaches — keep the
    // chart honest but readable by starting where the data gets dense.
    .filter((d) => d.year >= "2007");

  const classMap = new Map<string, number>();
  for (const b of breaches) {
    for (const c of b.DataClasses) {
      classMap.set(c, (classMap.get(c) ?? 0) + 1);
    }
  }
  const topDataClasses = Array.from(classMap.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((100 * count) / breaches.length) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const withRealLogo = breaches
    .filter((b) => hasRealLogo(b) && b.PwnCount > 10_000_000 && !b.IsSensitive)
    .sort((a, b) => b.PwnCount - a.PwnCount)
    .slice(0, 24);

  const newestFirst = [...breaches].sort((a, b) => b.BreachDate.localeCompare(a.BreachDate));

  return {
    totalBreaches: breaches.length,
    totalAccounts,
    biggest,
    byYear,
    topDataClasses,
    withRealLogo,
    newestFirst,
  };
}
