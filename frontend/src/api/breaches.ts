import type { Breach } from "@/types/breaches";

// HIBP's /breaches endpoint is public, key-less, and ships
// Access-Control-Allow-Origin: * — so the browser can fetch it directly,
// no backend proxy needed. ~1MB of JSON for ~1,000 breaches.
const HIBP_BREACHES_URL = "https://haveibeenpwned.com/api/v3/breaches";

export async function fetchBreaches(): Promise<Breach[]> {
  const res = await fetch(HIBP_BREACHES_URL);
  if (!res.ok) {
    throw new Error(`HIBP request failed with ${res.status}`);
  }
  return res.json() as Promise<Breach[]>;
}
