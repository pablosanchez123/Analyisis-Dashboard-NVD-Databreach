import { Link, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export function Header() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <ShieldAlert className="size-6 text-[var(--series-1)]" strokeWidth={2} />
          <div>
            <p className="text-base font-semibold leading-tight">{t.header.title}</p>
            <p className="text-xs text-muted-foreground">{t.header.subtitle}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                location.pathname === "/" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.nav.dashboard}
            </Link>
            <Link
              to="/methodology"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                location.pathname === "/methodology" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t.nav.methodology}
            </Link>
            <Link
              to="/breaches"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              {t.nav.breaches}
            </Link>
          </nav>
          <div className="flex items-center rounded-md border border-border p-0.5 text-xs font-medium">
            {(["en", "es"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                aria-pressed={language === lang}
                className={cn(
                  "rounded px-2 py-1 uppercase transition-colors",
                  language === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
