export type Language = "en" | "es";

export interface Translations {
  header: { title: string; subtitle: string };
  nav: { dashboard: string; methodology: string };
  warmup: { waking: string; wakingSub: string; gaveUp: string; gaveUpSub: string };
  dashboard: {
    title: string;
    severityTitle: string;
    severityDesc: string;
    vendorsTitle: string;
    vendorsDesc: string;
    cweTitle: string;
    cweDesc: string;
    forecastTitle: string;
    forecastDesc: string;
    patchTitle: string;
    patchDesc: string;
  };
  severity: { LOW: string; MEDIUM: string; HIGH: string; CRITICAL: string };
  charts: {
    cves: string;
    actual: string;
    forecast: string;
    confidenceInterval: string;
    inProgress: string;
    loadErrorSeverity: string;
    loadErrorVendors: string;
    loadErrorCwe: string;
    loadErrorForecast: string;
    loadErrorPatchTime: string;
    forecastNotReady: string;
  };
  patchTime: { label: string; sublabel: (pct: string, sample: string, total: string) => string };
  freshness: { lastIngested: string };
  methodology: {
    title: string;
    intro: string;
    dataSource: { title: string; body1a: string; linkText: string; body1b: string };
    cvss: { title: string; body: string };
    vendor: { title: string; body: string };
    patchTime: { title: string; alertTitle: string; body: string };
    forecast: { title: string; alertTitle: string; body: string };
    cwe: { title: string; body: string };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    header: {
      title: "NVD Vulnerability Dashboard",
      subtitle: "CVE threat-landscape analysis, 2019–present",
    },
    nav: {
      dashboard: "Dashboard",
      methodology: "Methodology",
    },
    warmup: {
      waking: "Waking up the data server…",
      wakingSub: "This dashboard runs on a self-hosted API — first load can take a few seconds.",
      gaveUp: "The data server is taking longer than usual to wake up.",
      gaveUpSub: "It's self-hosted and may be cold-starting. Try refreshing in a minute.",
    },
    dashboard: {
      title: "Vulnerability landscape",
      severityTitle: "CVE severity trend",
      severityDesc: "Quarterly count of published CVEs by CVSS severity",
      vendorsTitle: "Top vendors & products",
      vendorsDesc: "Most-affected vendor/product pairs by CVE count",
      cweTitle: "Weakness type distribution",
      cweDesc: "Top CWE categories across all tracked CVEs",
      forecastTitle: "Critical CVE forecast",
      forecastDesc: "Quarterly CVSS CRITICAL count, historical + Prophet forecast",
      patchTitle: "Patch-time approximation",
      patchDesc: "Time from publication to last known update",
    },
    severity: {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical",
    },
    charts: {
      cves: "CVEs",
      actual: "Actual",
      forecast: "Forecast",
      confidenceInterval: "Confidence interval",
      inProgress: "In progress (partial)",
      loadErrorSeverity: "Couldn't load severity trend.",
      loadErrorVendors: "Couldn't load top vendors.",
      loadErrorCwe: "Couldn't load CWE distribution.",
      loadErrorForecast: "Couldn't load forecast.",
      loadErrorPatchTime: "Couldn't load patch-time metric.",
      forecastNotReady: "Forecast not yet computed — run the ingestion pipeline.",
    },
    patchTime: {
      label: "Avg. days from publication to last metadata update",
      sublabel: (pct: string, sample: string, total: string) =>
        `${pct}% of CVEs (${sample} of ${total}) have a known patch reference`,
    },
    freshness: {
      lastIngested: "Last ingested",
    },
    methodology: {
      title: "Methodology & data caveats",
      intro:
        "This dashboard is built on real, messy government data. Rather than hide the rough edges, this page states every approximation up front — the same underlying caveats are returned directly by the API.",
      dataSource: {
        title: "Data source",
        body1a: "All CVE records come from the ",
        linkText: "NVD CVE API 2.0",
        body1b:
          " (NIST National Vulnerability Database), backfilled from 2019-01-01 onward and refreshed on a weekly schedule via NVD's incremental (lastModified) endpoint.",
      },
      cvss: {
        title: "CVSS severity normalization",
        body: "A CVE can carry multiple CVSS versions (v2, v3.0, v3.1, v4.0) simultaneously. This dashboard prefers v3.1 → v3.0 → v4.0 → v2, in that order, since v3.x/v4.0 scores are broadly comparable across years and only v3.x/v4.0 define a CRITICAL severity band. Any severity trend or “critical CVE” count reflects that preference order, not a re-scored consensus across versions.",
      },
      vendor: {
        title: "Vendor / product extraction",
        body: "NVD does not expose a clean “vendor” field. Vendor and product are parsed out of CPE 2.3 match strings attached to each CVE's affected configurations, keeping only entries NVD marks as vulnerable. Many very recently published CVEs (within the last few days) haven't yet been enriched with this configuration data by NVD analysts — the top-vendors chart under-counts the newest CVEs until NVD catches up on that backlog.",
      },
      patchTime: {
        title: "Patch-time approximation",
        alertTitle: "Not a verified patch-release date",
        body: "NVD has no field for “when a patch became available.” This dashboard proxies it as the gap between a CVE's publication date and its last-modified date, restricted to CVEs that carry a reference tagged Patch or Vendor Advisory. Because last_modified changes on any metadata edit — not only when a patch reference is added — this number skews high, especially for older CVEs NVD has revisited. A more rigorous version would use NVD's CVE Change History API to find the actual date a patch reference was added; that's noted here as known future work, not built into this dashboard.",
      },
      forecast: {
        title: "Forecast methodology",
        alertTitle: "Directional trend, not a precise prediction",
        body: "The forecast is fit with Facebook Prophet on quarterly counts of CVSS v3.x/v4.0 CRITICAL-severity CVEs, recomputed as part of the ingestion pipeline (never on-demand). Published CVE volume is a function of disclosure and reporting practices as much as it is of real-world vulnerability incidence — a rising trend can mean more scrutiny, not necessarily a more dangerous software ecosystem.",
      },
      cwe: {
        title: "CWE distribution",
        body: "A CVE can carry multiple CWE (weakness type) entries; all are counted. NVD's placeholder values (NVD-CWE-noinfo, NVD-CWE-Other) are excluded from the distribution chart since they carry no real weakness-type information and would otherwise dominate the ranking.",
      },
    },
  },
  es: {
    header: {
      title: "Dashboard de Vulnerabilidades NVD",
      subtitle: "Análisis del panorama de amenazas CVE, 2019–presente",
    },
    nav: {
      dashboard: "Dashboard",
      methodology: "Metodología",
    },
    warmup: {
      waking: "Despertando el servidor de datos…",
      wakingSub: "Este dashboard corre sobre una API self-hosted — la primera carga puede tardar unos segundos.",
      gaveUp: "El servidor de datos está tardando más de lo habitual en despertar.",
      gaveUpSub: "Es self-hosted y puede estar arrancando en frío. Proba recargar en un minuto.",
    },
    dashboard: {
      title: "Panorama de vulnerabilidades",
      severityTitle: "Tendencia de severidad de CVEs",
      severityDesc: "Cantidad trimestral de CVEs publicados por severidad CVSS",
      vendorsTitle: "Top vendors y productos",
      vendorsDesc: "Pares vendor/producto más afectados por cantidad de CVEs",
      cweTitle: "Distribución por tipo de vulnerabilidad",
      cweDesc: "Principales categorías CWE entre todos los CVEs registrados",
      forecastTitle: "Predicción de CVEs críticos",
      forecastDesc: "Conteo trimestral de CVSS CRITICAL, histórico + predicción con Prophet",
      patchTitle: "Aproximación de tiempo de parcheo",
      patchDesc: "Tiempo desde la publicación hasta la última actualización conocida",
    },
    severity: {
      LOW: "Baja",
      MEDIUM: "Media",
      HIGH: "Alta",
      CRITICAL: "Crítica",
    },
    charts: {
      cves: "CVEs",
      actual: "Real",
      forecast: "Predicción",
      confidenceInterval: "Intervalo de confianza",
      inProgress: "En curso (parcial)",
      loadErrorSeverity: "No se pudo cargar la tendencia de severidad.",
      loadErrorVendors: "No se pudo cargar el top de vendors.",
      loadErrorCwe: "No se pudo cargar la distribución de CWE.",
      loadErrorForecast: "No se pudo cargar la predicción.",
      loadErrorPatchTime: "No se pudo cargar la métrica de tiempo de parcheo.",
      forecastNotReady: "La predicción aún no fue calculada — ejecutá el pipeline de ingesta.",
    },
    patchTime: {
      label: "Prom. de días entre publicación y última actualización",
      sublabel: (pct: string, sample: string, total: string) =>
        `${pct}% de los CVEs (${sample} de ${total}) tienen una referencia de parche conocida`,
    },
    freshness: {
      lastIngested: "Última ingesta",
    },
    methodology: {
      title: "Metodología y limitaciones de los datos",
      intro:
        "Este dashboard está construido sobre datos gubernamentales reales, con todas sus imperfecciones. En vez de esconderlas, esta página expone cada aproximación — el mismo criterio metodológico que devuelve la API directamente.",
      dataSource: {
        title: "Fuente de datos",
        body1a: "Todos los registros de CVEs provienen de la ",
        linkText: "NVD CVE API 2.0",
        body1b:
          " (National Vulnerability Database del NIST), con una carga histórica desde el 2019-01-01 y actualizaciones semanales vía el endpoint incremental (lastModified) de NVD.",
      },
      cvss: {
        title: "Normalización de severidad CVSS",
        body: "Un CVE puede tener varias versiones de CVSS a la vez (v2, v3.0, v3.1, v4.0). Este dashboard prioriza v3.1 → v3.0 → v4.0 → v2, en ese orden, ya que los puntajes v3.x/v4.0 son comparables entre años y solo v3.x/v4.0 definen una banda de severidad CRITICAL. Cualquier tendencia de severidad o conteo de “CVE crítico” refleja ese orden de preferencia, no un consenso reevaluado entre versiones.",
      },
      vendor: {
        title: "Extracción de vendor / producto",
        body: "NVD no expone un campo limpio de “vendor”. Vendor y producto se extraen de los strings CPE 2.3 asociados a las configuraciones afectadas de cada CVE, quedándonos solo con las entradas que NVD marca como vulnerables. Muchos CVEs publicados muy recientemente (últimos días) todavía no fueron enriquecidos con estos datos de configuración por los analistas de NVD — el gráfico de top vendors subestima los CVEs más nuevos hasta que NVD se pone al día con ese backlog.",
      },
      patchTime: {
        title: "Aproximación de tiempo de parcheo",
        alertTitle: "No es una fecha de parche verificada",
        body: "NVD no tiene un campo para “cuándo estuvo disponible un parche”. Este dashboard lo aproxima como la diferencia entre la fecha de publicación de un CVE y su fecha de última modificación, limitado a CVEs que tienen una referencia etiquetada como Patch o Vendor Advisory. Como last_modified cambia ante cualquier edición de metadata — no solo cuando se agrega una referencia de parche — este número tiende a ser alto, especialmente en CVEs viejos que NVD revisitó. Una versión más rigurosa usaría la CVE Change History API de NVD para encontrar la fecha real en que se agregó la referencia de parche; eso queda anotado como trabajo futuro, no implementado en este dashboard.",
      },
      forecast: {
        title: "Metodología de la predicción",
        alertTitle: "Tendencia direccional, no una predicción precisa",
        body: "La predicción se ajusta con Facebook Prophet sobre conteos trimestrales de CVEs con severidad CRITICAL en CVSS v3.x/v4.0, recalculada como parte del pipeline de ingesta (nunca on-demand). El volumen de CVEs publicados depende tanto de las prácticas de divulgación y reporte como de la incidencia real de vulnerabilidades — una tendencia creciente puede significar más escrutínio, no necesariamente un ecosistema de software más peligroso.",
      },
      cwe: {
        title: "Distribución de CWE",
        body: "Un CVE puede tener varias entradas de CWE (tipo de debilidad); todas se cuentan. Los valores placeholder de NVD (NVD-CWE-noinfo, NVD-CWE-Other) se excluyen del gráfico de distribución porque no aportan información real sobre el tipo de debilidad y dominarían el ranking sin motivo.",
      },
    },
  },
};
