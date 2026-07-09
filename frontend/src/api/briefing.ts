import { apiGet } from "./client";
import type { BriefingResponse } from "@/types/briefing";

export interface QuarterSelection {
  year: number;
  quarter: number;
}

export const fetchBriefing = (selection?: QuarterSelection) => {
  const qs = selection ? `?year=${selection.year}&quarter=${selection.quarter}` : "";
  return apiGet<BriefingResponse>(`/api/briefing${qs}`);
};
