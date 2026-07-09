import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import ReactLenis from "lenis/react";
import { ArrowLeft, ArrowUpRight, Search, ShieldAlert } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LogoCarousel } from "@/components/ui/logo-carousel";
import { useBreaches } from "@/hooks/useBreaches";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Breach } from "@/types/breaches";
import type { Translations } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const ACCENT = "#ff3b30";

const DATA_CLASS_ES: Record<string, string> = {
  "Email addresses": "Direcciones de email",
  Passwords: "Contraseñas",
  Names: "Nombres",
  Usernames: "Nombres de usuario",
  "IP addresses": "Direcciones IP",
  "Phone numbers": "Números de teléfono",
  "Physical addresses": "Direcciones físicas",
  "Dates of birth": "Fechas de nacimiento",
  "Geographic locations": "Ubicaciones geográficas",
  Genders: "Género",
};

function useNumberFormat() {
  const { language } = useLanguage();
  return useMemo(() => new Intl.NumberFormat(language === "es" ? "es" : "en-US"), [language]);
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto w-full max-w-5xl px-6"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff3b30]">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-500">{sub}</p>}
    </motion.div>
  );
}

/* ---------------------------------- nav ---------------------------------- */

function BreachesNav({ t }: { t: Translations }) {
  const { language, setLanguage } = useLanguage();
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-[#0a0a0a]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
          {t.breachesPage.navBack}
        </Link>
        <div className="flex items-center rounded-md border border-zinc-800 p-0.5 text-xs font-medium">
          {(["en", "es"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={cn(
                "rounded px-2 py-1 uppercase transition-colors",
                language === lang ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ---------------------------------- hero --------------------------------- */

function Hero({ totalAccounts, totalBreaches, t }: { totalAccounts: number; totalBreaches: number; t: Translations }) {
  const fmt = useNumberFormat();
  const [value, setValue] = useState(0);

  // AnimatedNumber's spring starts at its initial value — mount at 0, then
  // hand it the real total so the count-up actually plays.
  useEffect(() => {
    const id = setTimeout(() => setValue(totalAccounts), 300);
    return () => clearTimeout(id);
  }, [totalAccounts]);

  return (
    <header className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-40%] h-[70%]"
        style={{ background: `radial-gradient(ellipse at center, ${ACCENT}22 0%, transparent 60%)` }}
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">{t.breachesPage.eyebrow}</p>
      <h1 className="mt-8 text-center font-semibold tabular-nums leading-none tracking-tighter text-zinc-50" style={{ fontSize: "clamp(2.2rem, 8.5vw, 7.5rem)" }}>
        <AnimatedNumber value={value} format={(n) => fmt.format(Math.round(n))} mass={1} stiffness={40} damping={22} />
      </h1>
      <p className="mt-6 max-w-md text-center text-lg leading-snug text-zinc-400">
        {t.breachesPage.heroAccountsLine(fmt.format(totalBreaches))}
      </p>
      <p className="mt-2 text-center text-sm text-zinc-600">{t.breachesPage.heroKicker}</p>
      <div className="absolute bottom-8 flex flex-col items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">{t.breachesPage.scrollHint}</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-zinc-600 to-transparent"
        />
      </div>
    </header>
  );
}

/* ------------------------ scroll-driven decrypt reveal -------------------- */

const GLYPHS = "!<>-_\\/[]{}—=+*^?#$&@%01894ABDEFX§";

// Characters resolve in a deterministic-but-shuffled order between these two
// points of the section's scroll progress, so the phrase "decrypts" as you go.
const DECRYPT_START = 0.12;
const DECRYPT_END = 0.72;

function DecryptReveal({ phrase }: { phrase: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setProgress(v));

  // Cycle the unresolved glyphs; stop ticking once everything is readable.
  const [tick, setTick] = useState(0);
  const done = progress >= DECRYPT_END;
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTick((t) => t + 1), 70);
    return () => clearInterval(id);
  }, [done]);

  const chars = useMemo(() => phrase.split(""), [phrase]);

  const thresholds = useMemo(() => {
    const indices = chars.map((_, i) => i);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const out = new Array<number>(chars.length);
    indices.forEach((charIdx, order) => {
      out[charIdx] = DECRYPT_START + (DECRYPT_END - DECRYPT_START) * (order / Math.max(1, indices.length - 1));
    });
    return out;
  }, [chars]);

  const pct = Math.round(Math.min(1, Math.max(0, (progress - DECRYPT_START) / (DECRYPT_END - DECRYPT_START))) * 100);

  return (
    <section ref={targetRef} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-svh w-full flex-col items-center justify-center overflow-hidden px-6">
        <p className="w-full max-w-5xl text-center font-mono text-3xl font-bold uppercase leading-tight tracking-tight sm:text-6xl">
          {chars.map((char, i) => {
            const isSpace = char === " ";
            const resolved = isSpace || progress >= thresholds[i];
            return (
              <span
                key={i}
                className="inline-block whitespace-pre transition-colors duration-200"
                style={{ color: resolved ? "#fafafa" : ACCENT, opacity: resolved ? 1 : 0.85 }}
              >
                {resolved ? char : GLYPHS[(i * 31 + tick * 7) % GLYPHS.length]}
              </span>
            );
          })}
        </p>
        <div className="mt-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em]">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: pct >= 100 ? "#22c55e" : ACCENT, boxShadow: `0 0 8px ${pct >= 100 ? "#22c55e" : ACCENT}` }}
          />
          <span className="tabular-nums text-zinc-500">
            {pct >= 100 ? "DECRYPTED" : `DECRYPTING… ${String(pct).padStart(2, "0")}%`}
          </span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- giant breach dossier deck -------------------- */
/* The five biggest breaches sit stacked like case files on a desk, each with
   its own slight tilt; scrolling hurls the top file off-screen (with spin) to
   reveal the next, while the active breach's year looms behind the pile. */

const DECK_TILT = [-2.5, 3, -1.8, 2.4, -3.2];

function DossierCard({
  breach,
  i,
  total,
  progress,
  t,
  language,
}: {
  breach: Breach;
  i: number;
  total: number;
  progress: MotionValue<number>;
  t: Translations;
  language: string;
}) {
  const fmt = useNumberFormat();
  const isLast = i === total - 1;
  const baseTilt = DECK_TILT[i % DECK_TILT.length];

  // Each non-final card flies away over its own slice of the section's
  // scroll; the last one gets an impossible range so it never leaves.
  const flyStart = isLast ? 2 : (i + 0.15) / total;
  const flyEnd = isLast ? 3 : (i + 0.95) / total;
  const fly = useTransform(progress, [flyStart, flyEnd], [0, 1]);

  const y = useTransform(fly, [0, 1], [`${i * 1.4}vh`, "-150vh"]);
  const rotate = useTransform(fly, [0, 0.25, 1], [baseTilt, baseTilt * 2.5, baseTilt * 9]);
  const x = useTransform(fly, [0, 1], ["0vw", baseTilt > 0 ? "18vw" : "-18vw"]);

  return (
    <motion.article
      style={{ y, x, rotate, scale: 1 - i * 0.02, zIndex: total - i }}
      className="absolute flex h-[430px] w-[calc(100vw-2.5rem)] max-w-xl flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-[#121214] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-2 select-none font-mono text-[9rem] font-bold leading-none tracking-tighter text-zinc-100/[0.04]"
      >
        {String(i + 1).padStart(2, "0")}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
            {`CASE ${String(i + 1).padStart(2, "0")} — ${breach.BreachDate.slice(0, 4)}`}
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">{breach.Title}</h3>
          {breach.Domain && <p className="mt-1 text-sm text-zinc-500">{breach.Domain}</p>}
        </div>
        <img
          src={breach.LogoPath}
          alt=""
          loading="lazy"
          className="size-14 shrink-0 rounded-lg bg-zinc-900 object-contain p-2"
        />
      </div>

      <div>
        <p className="text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl" style={{ color: ACCENT }}>
          {fmt.format(breach.PwnCount)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">{t.breachesPage.accountsWord}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {breach.DataClasses.slice(0, 5).map((c) => (
          <span
            key={c}
            className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-400"
          >
            {language === "es" ? (DATA_CLASS_ES[c] ?? c) : c}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

function GiantsStack({ breaches, t, language }: { breaches: Breach[]; t: Translations; language: string }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(breaches.length - 1, Math.max(0, Math.floor(p * breaches.length + 0.05))));
  });

  return (
    <section className="pt-28">
      <SectionHeading eyebrow={t.breachesPage.giantsEyebrow} title={t.breachesPage.giantsTitle} />
      <div ref={container} className="relative mt-8" style={{ height: `${breaches.length * 110}vh` }}>
        <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-mono text-[26vw] font-bold leading-none tracking-tighter text-zinc-100/[0.03]"
          >
            {breaches[active]?.BreachDate.slice(0, 4)}
          </div>

          <div className="absolute right-6 top-20 font-mono text-xs tabular-nums tracking-[0.25em] text-zinc-600 sm:right-10">
            {String(active + 1).padStart(2, "0")} <span className="text-zinc-800">/</span>{" "}
            {String(breaches.length).padStart(2, "0")}
          </div>

          {breaches.map((b, i) => (
            <DossierCard
              key={b.Name}
              breach={b}
              i={i}
              total={breaches.length}
              progress={scrollYProgress}
              t={t}
              language={language}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ year timeline ----------------------------- */

function YearTimeline({ byYear, t }: { byYear: { year: string; count: number }[]; t: Translations }) {
  const fmt = useNumberFormat();
  return (
    <section className="pt-36">
      <SectionHeading eyebrow={t.breachesPage.timelineEyebrow} title={t.breachesPage.timelineTitle} sub={t.breachesPage.timelineSub} />
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="mx-auto mt-10 w-full max-w-5xl px-6"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byYear} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="year"
              tick={{ fill: "#52525b", fontSize: 11 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <Tooltip
              cursor={{ fill: "#ffffff08" }}
              contentStyle={{
                background: "#111113",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 13,
                color: "#e4e4e7",
              }}
              labelStyle={{ color: "#e4e4e7", fontWeight: 600 }}
              itemStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [fmt.format(Number(value)), t.breachesPage.breachesWord]}
            />
            <Bar dataKey="count" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </section>
  );
}

/* ------------------------------- data classes ----------------------------- */

function DataClassBars({
  classes,
  t,
  language,
}: {
  classes: { name: string; pct: number }[];
  t: Translations;
  language: string;
}) {
  return (
    <section className="pt-36">
      <SectionHeading eyebrow={t.breachesPage.classesEyebrow} title={t.breachesPage.classesTitle} sub={t.breachesPage.classesSub} />
      <div className="mx-auto mt-10 w-full max-w-3xl space-y-5 px-6">
        {classes.map((c, i) => (
          <div key={c.name}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-zinc-300">{language === "es" ? (DATA_CLASS_ES[c.name] ?? c.name) : c.name}</span>
              <span className="font-mono tabular-nums text-zinc-500">
                {c.pct}% <span className="hidden text-zinc-700 sm:inline">{t.breachesPage.ofBreaches}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${c.pct}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: i === 0 ? ACCENT : "#e4e4e7", opacity: i === 0 ? 1 : Math.max(0.25, 1 - i * 0.12) }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- logo wall ------------------------------ */

function LogoWall({ breaches, t }: { breaches: Breach[]; t: Translations }) {
  const logos = useMemo(
    () => breaches.map((b) => ({ id: b.Name, name: b.Title, src: b.LogoPath })),
    [breaches],
  );
  return (
    <section className="pt-36">
      <SectionHeading eyebrow={t.breachesPage.logosEyebrow} title={t.breachesPage.logosTitle} />
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="mt-12 flex justify-center rounded-xl [&_img]:brightness-0 [&_img]:invert"
      >
        <LogoCarousel logos={logos} columnCount={4} />
      </motion.div>
    </section>
  );
}

/* --------------------------------- explorer ------------------------------- */

const PAGE_SIZE = 24;

function Explorer({ breaches, t, language }: { breaches: Breach[]; t: Translations; language: string }) {
  const fmt = useNumberFormat();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return breaches;
    return breaches.filter(
      (b) => b.Title.toLowerCase().includes(q) || b.Domain.toLowerCase().includes(q) || b.Name.toLowerCase().includes(q),
    );
  }, [breaches, query]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(language === "es" ? "es" : "en-US", { year: "numeric", month: "short" }),
    [language],
  );

  return (
    <section className="pt-36">
      <SectionHeading eyebrow={t.breachesPage.explorerEyebrow} title={t.breachesPage.explorerTitle} />

      <div className="mx-auto mt-8 w-full max-w-5xl px-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder={t.breachesPage.searchPlaceholder}
            className="w-full rounded-lg border border-zinc-800 bg-[#111113] py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-zinc-600">{t.breachesPage.noMatches}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((b, i) => (
              <motion.a
                key={b.Name}
                href={`https://haveibeenpwned.com/breach/${b.Name}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: (i % 6) * 0.04 }}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-[#101012] p-4 transition-colors hover:border-zinc-600"
              >
                <img
                  src={b.LogoPath}
                  alt=""
                  loading="lazy"
                  className="mt-0.5 size-9 shrink-0 rounded-md bg-zinc-900 object-contain p-1.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-medium text-zinc-200">{b.Title}</h3>
                    <ArrowUpRight className="size-3.5 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400" />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600">{dateFmt.format(new Date(b.BreachDate))}</p>
                  <p className="mt-1.5 font-mono text-xs tabular-nums text-zinc-400">
                    {fmt.format(b.PwnCount)} <span className="text-zinc-600">{t.breachesPage.accountsWord}</span>
                  </p>
                  {b.IsSensitive && (
                    <span className="mt-2 inline-block rounded-full border border-amber-900/60 bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-500">
                      {t.breachesPage.sensitiveTag}
                    </span>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {visible < filtered.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              {t.breachesPage.showMore} ({fmt.format(filtered.length - visible)})
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------ cta --------------------------------- */

function FinalCta({ t }: { t: Translations }) {
  return (
    <section className="relative mt-36 overflow-hidden border-t border-zinc-900 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-40%] h-[80%]"
        style={{ background: `radial-gradient(ellipse at center, ${ACCENT}18 0%, transparent 60%)` }}
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <ShieldAlert className="size-8" style={{ color: ACCENT }} />
        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">{t.breachesPage.ctaTitle}</h2>
        <p className="mt-4 max-w-md text-base text-zinc-500">{t.breachesPage.ctaBody}</p>
        <a
          href="https://haveibeenpwned.com"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          style={{ background: ACCENT }}
        >
          {t.breachesPage.ctaButton}
          <ArrowUpRight className="size-4" />
        </a>
        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">{t.breachesPage.attribution}</p>
      </div>
    </section>
  );
}

/* ------------------------------------ page -------------------------------- */

export function Breaches() {
  const { t, language } = useLanguage();
  const { stats, isLoading, error } = useBreaches();

  useEffect(() => {
    document.title = language === "es" ? "Filtraciones de Datos — NVD Dashboard" : "Data Breaches — NVD Dashboard";
    return () => {
      document.title = "NVD Vulnerability Dashboard";
    };
  }, [language]);

  return (
    <ReactLenis root>
      <div className="min-h-svh bg-[#0a0a0a] text-zinc-200 antialiased selection:bg-[#ff3b30] selection:text-white">
        <BreachesNav t={t} />

        {isLoading && (
          <div className="flex min-h-svh items-center justify-center">
            <p className="animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">
              {t.breachesPage.loading}
            </p>
          </div>
        )}

        {error != null && (
          <div className="flex min-h-svh items-center justify-center px-6">
            <p className="text-sm text-zinc-500">{t.breachesPage.loadError}</p>
          </div>
        )}

        {stats && (
          <main>
            <Hero totalAccounts={stats.totalAccounts} totalBreaches={stats.totalBreaches} t={t} />
            <DecryptReveal phrase={t.breachesPage.editorialPhrase} />
            <GiantsStack breaches={stats.biggest} t={t} language={language} />
            <YearTimeline byYear={stats.byYear} t={t} />
            <DataClassBars classes={stats.topDataClasses} t={t} language={language} />
            <LogoWall breaches={stats.withRealLogo} t={t} />
            <Explorer breaches={stats.newestFirst} t={t} language={language} />
            <FinalCta t={t} />
          </main>
        )}
      </div>
    </ReactLenis>
  );
}
