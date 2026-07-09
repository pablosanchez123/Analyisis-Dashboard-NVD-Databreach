export interface QuarterOption {
  year: number;
  quarter: number;
  label: string;
}

function quarterOf(date: Date): { year: number; quarter: number } {
  return { year: date.getFullYear(), quarter: Math.floor(date.getMonth() / 3) + 1 };
}

/** All complete quarters from the data's earliest year through the last
 * complete quarter relative to "now" (the in-progress current quarter is
 * excluded — same rule the backend enforces), newest first. */
export function listAvailableQuarters(earliestDateIso: string | null | undefined, now: Date = new Date()): QuarterOption[] {
  const startYear = earliestDateIso ? new Date(earliestDateIso).getFullYear() : now.getFullYear();
  const current = quarterOf(now);

  let lastCompleteYear = current.year;
  let lastCompleteQuarter = current.quarter - 1;
  if (lastCompleteQuarter === 0) {
    lastCompleteQuarter = 4;
    lastCompleteYear -= 1;
  }

  const options: QuarterOption[] = [];
  for (let year = lastCompleteYear; year >= startYear; year--) {
    const maxQ = year === lastCompleteYear ? lastCompleteQuarter : 4;
    for (let q = maxQ; q >= 1; q--) {
      options.push({ year, quarter: q, label: `Q${q} ${year}` });
    }
  }
  return options;
}
