import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useForecast } from "@/hooks/useMetric";
import { useLanguage } from "@/i18n/LanguageContext";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function Methodology() {
  const { t, language } = useLanguage();
  const { data: forecast } = useForecast();
  const m = t.methodology;

  const forecastAlertBody = language === "es" ? m.forecast.body : (forecast?.caveat ?? m.forecast.body);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">{m.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{m.intro}</p>

      <Section title={m.dataSource.title}>
        <p>
          {m.dataSource.body1a}
          <a
            className="underline underline-offset-2"
            href="https://nvd.nist.gov/developers/vulnerabilities"
            target="_blank"
            rel="noreferrer"
          >
            {m.dataSource.linkText}
          </a>
          {m.dataSource.body1b}
        </p>
      </Section>

      <Section title={m.cvss.title}>
        <p>{m.cvss.body}</p>
      </Section>

      <Section title={m.vendor.title}>
        <p>{m.vendor.body}</p>
      </Section>

      <Section title={m.patchTime.title}>
        <p>{m.patchTime.body}</p>
      </Section>

      <Section title={m.forecast.title}>
        <Alert>
          <Info />
          <AlertTitle>{m.forecast.alertTitle}</AlertTitle>
          <AlertDescription>{forecastAlertBody}</AlertDescription>
        </Alert>
      </Section>

      <Section title={m.cwe.title}>
        <p>{m.cwe.body}</p>
      </Section>
    </div>
  );
}
