import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/pages/Dashboard";
import { Methodology } from "@/pages/Methodology";
import { Breaches } from "@/pages/Breaches";
import { useServerWarmup } from "@/hooks/useServerWarmup";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function WarmupGate({ children }: { children: ReactNode }) {
  const { isAwake, gaveUp } = useServerWarmup();
  const { t } = useLanguage();

  if (!isAwake) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <ShieldAlert className="size-8 text-[var(--series-1)]" />
        </motion.div>
        <div>
          <p className="text-base font-medium">{gaveUp ? t.warmup.gaveUp : t.warmup.waking}</p>
          <p className="mt-1 text-sm text-muted-foreground">{gaveUp ? t.warmup.gaveUpSub : t.warmup.wakingSub}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Self-contained dark experience: fetches HIBP directly, so it
                  skips the NVD-backend warmup gate and global header. */}
              <Route path="/breaches" element={<Breaches />} />
              <Route
                path="*"
                element={
                  <WarmupGate>
                    <Header />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/methodology" element={<Methodology />} />
                    </Routes>
                  </WarmupGate>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
