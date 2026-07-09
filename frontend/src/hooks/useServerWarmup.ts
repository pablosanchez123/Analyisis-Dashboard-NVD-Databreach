import { useEffect, useState } from "react";
import { pingHealth } from "@/api/client";

const RETRY_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20; // ~60s, covers a cold Render/homelab-container wake-up

export function useServerWarmup() {
  const [isAwake, setIsAwake] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        const ok = await pingHealth();
        if (ok) {
          if (!cancelled) setIsAwake(true);
          return;
        }
        if (!cancelled) setAttempt(i + 1);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
      if (!cancelled) setGaveUp(true);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isAwake, attempt, gaveUp };
}
