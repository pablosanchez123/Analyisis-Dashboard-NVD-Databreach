import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function BreachesTeaser() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Link
        to="/breaches"
        className="group relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-lg border border-zinc-800 bg-[#0a0a0a] p-5 transition-colors hover:border-zinc-700 sm:flex-row sm:items-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{ background: "radial-gradient(ellipse at right, #ff3b3022 0%, transparent 70%)" }}
        />
        <div className="relative flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#ff3b30]" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              {t.breachesTeaser.eyebrow}
            </p>
            <p className="mt-1 text-base font-semibold text-zinc-100">{t.breachesTeaser.title}</p>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">{t.breachesTeaser.body}</p>
          </div>
        </div>
        <span className="relative inline-flex shrink-0 items-center gap-2 rounded-md bg-[#ff3b30] px-4 py-2 text-sm font-semibold text-white transition-transform group-hover:translate-x-0.5">
          {t.breachesTeaser.button}
          <ArrowRight className="size-4" />
        </span>
      </Link>
    </motion.div>
  );
}
