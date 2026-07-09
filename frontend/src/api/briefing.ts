import { apiGet } from "./client";
import type { BriefingResponse } from "@/types/briefing";

export const fetchBriefing = () => apiGet<BriefingResponse>("/api/briefing");
