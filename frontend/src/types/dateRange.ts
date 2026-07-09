export interface DateRange {
  startDate: string | null; // 'YYYY-MM-DD', null = no lower bound
  endDate: string | null; // 'YYYY-MM-DD', null = no upper bound
}

export const ALL_TIME: DateRange = { startDate: null, endDate: null };

export function dateRangeToQuery(range: DateRange): string {
  const params = new URLSearchParams();
  if (range.startDate) params.set("start_date", range.startDate);
  if (range.endDate) params.set("end_date", range.endDate);
  const qs = params.toString();
  return qs ? `&${qs}` : "";
}
