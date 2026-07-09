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
  filters: {
    label: string;
    allTime: string;
    last90Days: string;
    last12Months: string;
    last2Years: string;
    yearToDate: string;
    custom: string;
    to: string;
  };
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
  watchlist: {
    title: string;
    description: string;
    placeholder: string;
    minChars: string;
    noResults: string;
    searching: string;
    resultCves: (count: number) => string;
    resultCritical: (count: number) => string;
    totalCves: string;
    criticalPct: string;
    trendTitle: string;
    recentTitle: string;
    colCve: string;
    colDate: string;
    colSeverity: string;
    colCvss: string;
    colExploit: string;
    exploitAvailable: string;
    notFound: string;
    loadError: string;
    clear: string;
  };
  briefing: {
    title: string;
    subtitle: string;
    narrative: (facts: {
      quarter: string;
      totalCves: string;
      criticalCves: string;
      trend: "up" | "down" | "flat" | "none";
      pct: string;
      previousQuarter: string;
      topVendor: string | null;
      topProduct: string | null;
      topVendorCount: string;
      topCweName: string | null;
    }) => string;
    downloadExcel: string;
    downloadPdf: string;
    loadError: string;
    selectQuarter: string;
    kpiTotal: string;
    kpiCritical: string;
    kpiChange: string;
    kpiNoChange: string;
    printFooter: string;
  };
  comparator: {
    title: string;
    description: string;
    placeholder: string;
    addedCount: (count: number, max: number) => string;
    alreadyAdded: string;
    needTwo: string;
    colVendor: string;
    colTotal: string;
    colCritical: string;
    remove: string;
    loadError: string;
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
      severityDesc: "CVEs published each quarter, by severity",
      vendorsTitle: "Top vendors & products",
      vendorsDesc: "Which vendors show up most",
      cweTitle: "Weakness type distribution",
      cweDesc: "The most common vulnerability types",
      forecastTitle: "Critical CVE forecast",
      forecastDesc: "Critical CVEs per quarter, plus a forecast",
      patchTitle: "Patch-time approximation",
      patchDesc: "Estimated time from publish to patch",
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
    filters: {
      label: "Date range",
      allTime: "All time",
      last90Days: "Last 90 days",
      last12Months: "Last 12 months",
      last2Years: "Last 2 years",
      yearToDate: "Year to date",
      custom: "Custom",
      to: "to",
    },
    methodology: {
      title: "Methodology & data caveats",
      intro:
        "This dashboard runs on real government data, so it has real limits. Here's what every number actually means, in plain terms.",
      dataSource: {
        title: "Data source",
        body1a: "Every CVE here comes from the ",
        linkText: "NVD CVE API 2.0",
        body1b: " (NIST), loaded from 2019 onward and updated weekly.",
      },
      cvss: {
        title: "Severity scores",
        body: "A CVE can have several CVSS versions. We use the newest one available — v3.1, then v3.0, v4.0, then v2. \"Critical\" always means CVSS v3.x or v4.0; v2 has no Critical tier, so it's never counted as one.",
      },
      vendor: {
        title: "Vendor & product data",
        body: "NVD doesn't have a clean \"vendor\" field — we pull it from technical CPE strings instead. Very recent CVEs may be missing this data until NVD reviews them, so brand-new vulnerabilities can look under-counted here for a few days.",
      },
      patchTime: {
        title: "Patch-time estimate",
        alertTitle: "Not an exact patch date",
        body: "NVD doesn't record \"when a patch shipped.\" We estimate it as the time between a CVE's publish date and its last update, counting only CVEs with a Patch or Vendor Advisory link. Old CVEs that got revisited later can push this number up. A more exact version would need NVD's change-history data — that's on our to-do list, not built yet.",
      },
      forecast: {
        title: "Forecast method",
        alertTitle: "A trend, not a promise",
        body: "The forecast uses Prophet, trained on quarterly counts of Critical CVEs. Treat it as a direction, not an exact number — the range widens the further out it looks. Also, more reported CVEs doesn't always mean more danger; it can just mean more scrutiny.",
      },
      cwe: {
        title: "Weakness types",
        body: "A CVE can have more than one weakness type, so all are counted. NVD's placeholder tags (used when the type is unknown) are left out so they don't crowd out the real ones.",
      },
    },
    watchlist: {
      title: "Vendor & product lookup",
      description: "Search any vendor or product to see its own CVE trend, critical share, and most recent vulnerabilities — check your own stack, not just the aggregate.",
      placeholder: "Search a vendor or product (e.g. apache log4j, microsoft windows_server_2019)…",
      minChars: "Type at least 2 characters to search",
      noResults: "No vendor/product matches that search",
      searching: "Searching…",
      resultCves: (count: number) => `${count} CVE${count === 1 ? "" : "s"}`,
      resultCritical: (count: number) => `${count} critical`,
      totalCves: "Total CVEs",
      criticalPct: "% critical",
      trendTitle: "CVE trend",
      recentTitle: "Most recent CVEs",
      colCve: "CVE",
      colDate: "Published",
      colSeverity: "Severity",
      colCvss: "CVSS",
      colExploit: "Exploit",
      exploitAvailable: "Exploit available",
      notFound: "No CVEs found for this vendor/product.",
      loadError: "Couldn't load this vendor/product.",
      clear: "Clear",
    },
    briefing: {
      title: "Quarterly briefing",
      subtitle: "Auto-generated from the underlying numbers — no manual writing involved",
      narrative: (f) => {
        const trendPhrase =
          f.trend === "up"
            ? `an increase of ${f.pct}%`
            : f.trend === "down"
              ? `a decrease of ${f.pct}%`
              : f.trend === "flat"
                ? "no meaningful change"
                : null;
        let s = `In ${f.quarter}, ${f.totalCves} CVEs were published (${f.criticalCves} of them CRITICAL)`;
        s += trendPhrase ? `, ${trendPhrase} versus ${f.previousQuarter}.` : ".";
        if (f.topVendor && f.topProduct) {
          s += ` The most affected product was ${f.topVendor} / ${f.topProduct} (${f.topVendorCount} CVEs)`;
          s += f.topCweName ? `, and the most common weakness type was ${f.topCweName}.` : ".";
        } else if (f.topCweName) {
          s += ` The most common weakness type was ${f.topCweName}.`;
        }
        return s;
      },
      downloadExcel: "Download Excel",
      downloadPdf: "Download PDF",
      loadError: "Couldn't load the quarterly briefing.",
      selectQuarter: "Quarter",
      kpiTotal: "Total CVEs",
      kpiCritical: "Critical CVEs",
      kpiChange: "vs previous quarter",
      kpiNoChange: "No meaningful change",
      printFooter: "NVD Vulnerability Dashboard — auto-generated report, not a substitute for full advisory review.",
    },
    comparator: {
      title: "Vendor comparison",
      description: "Add 2–4 vendors/products to compare their CVE trends side by side — useful for vendor risk calls.",
      placeholder: "Search a vendor or product to add…",
      addedCount: (count, max) => `${count} of ${max} added`,
      alreadyAdded: "Already added",
      needTwo: "Add at least 2 to compare",
      colVendor: "Vendor / product",
      colTotal: "Total CVEs",
      colCritical: "% critical",
      remove: "Remove",
      loadError: "Couldn't load the comparison.",
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
      severityDesc: "CVEs publicados por trimestre, según severidad",
      vendorsTitle: "Top vendors y productos",
      vendorsDesc: "Qué vendors aparecen más seguido",
      cweTitle: "Distribución por tipo de vulnerabilidad",
      cweDesc: "Los tipos de vulnerabilidad más comunes",
      forecastTitle: "Predicción de CVEs críticos",
      forecastDesc: "CVEs críticos por trimestre, con una predicción",
      patchTitle: "Aproximación de tiempo de parcheo",
      patchDesc: "Tiempo estimado hasta el parche",
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
    filters: {
      label: "Rango de fechas",
      allTime: "Todo el histórico",
      last90Days: "Últimos 90 días",
      last12Months: "Últimos 12 meses",
      last2Years: "Últimos 2 años",
      yearToDate: "Lo que va del año",
      custom: "Personalizado",
      to: "hasta",
    },
    methodology: {
      title: "Metodología y limitaciones de los datos",
      intro:
        "Este dashboard usa datos reales del gobierno, con sus imperfecciones incluidas. Acá te explicamos, en criollo, qué significa cada número.",
      dataSource: {
        title: "Fuente de datos",
        body1a: "Cada CVE sale de la ",
        linkText: "NVD CVE API 2.0",
        body1b: " (NIST), cargada desde 2019 y actualizada cada semana.",
      },
      cvss: {
        title: "Puntaje de severidad",
        body: "Un CVE puede tener varias versiones de CVSS. Usamos la más nueva disponible: primero v3.1, después v3.0, v4.0, y v2. \"Crítico\" siempre significa CVSS v3.x o v4.0 — la v2 no tiene categoría Crítica, así que nunca cuenta como tal.",
      },
      vendor: {
        title: "Datos de vendor y producto",
        body: "NVD no tiene un campo limpio de \"vendor\" — lo sacamos de strings técnicos (CPE). Los CVEs muy recientes pueden no tener estos datos todavía porque NVD no los revisó, así que las vulnerabilidades nuevas pueden verse subrepresentadas por unos días.",
      },
      patchTime: {
        title: "Tiempo de parcheo estimado",
        alertTitle: "No es una fecha exacta de parche",
        body: "NVD no guarda \"cuándo salió el parche\". Lo estimamos como el tiempo entre la publicación y la última actualización, solo en CVEs con una referencia de Patch o Vendor Advisory. Los CVEs viejos que NVD revisó de nuevo después inflan este número. Una versión más precisa necesitaría el historial de cambios de NVD — queda como trabajo futuro, todavía no implementado.",
      },
      forecast: {
        title: "Método de predicción",
        alertTitle: "Es una tendencia, no una promesa",
        body: "La predicción usa Prophet, entrenado con los conteos trimestrales de CVEs críticos. Tomala como una dirección, no un número exacto — el margen se agranda cuanto más lejos mira. Además, más CVEs reportados no siempre significa más peligro; puede ser solo más atención.",
      },
      cwe: {
        title: "Tipos de debilidad",
        body: "Un CVE puede tener más de un tipo de debilidad, así que se cuentan todos. Los tags placeholder de NVD (cuando no se sabe el tipo) se excluyen para que no tapen a los reales.",
      },
    },
    watchlist: {
      title: "Búsqueda de vendor y producto",
      description: "Buscá cualquier vendor o producto para ver su propia tendencia de CVEs, porcentaje crítico, y las vulnerabilidades más recientes — revisá tu propio stack, no solo el agregado.",
      placeholder: "Buscá un vendor o producto (ej. apache log4j, microsoft windows_server_2019)…",
      minChars: "Escribí al menos 2 caracteres para buscar",
      noResults: "Ningún vendor/producto coincide con esa búsqueda",
      searching: "Buscando…",
      resultCves: (count: number) => `${count} CVE${count === 1 ? "" : "s"}`,
      resultCritical: (count: number) => `${count} críticos`,
      totalCves: "Total de CVEs",
      criticalPct: "% críticos",
      trendTitle: "Tendencia de CVEs",
      recentTitle: "CVEs más recientes",
      colCve: "CVE",
      colDate: "Publicado",
      colSeverity: "Severidad",
      colCvss: "CVSS",
      colExploit: "Exploit",
      exploitAvailable: "Exploit disponible",
      notFound: "No se encontraron CVEs para este vendor/producto.",
      loadError: "No se pudo cargar este vendor/producto.",
      clear: "Limpiar",
    },
    briefing: {
      title: "Resumen ejecutivo trimestral",
      subtitle: "Generado automáticamente a partir de los números — sin redacción manual",
      narrative: (f) => {
        const trendPhrase =
          f.trend === "up"
            ? `un aumento del ${f.pct}%`
            : f.trend === "down"
              ? `una baja del ${f.pct}%`
              : f.trend === "flat"
                ? "sin cambios significativos"
                : null;
        let s = `En ${f.quarter} se publicaron ${f.totalCves} CVEs (${f.criticalCves} de severidad CRITICAL)`;
        s += trendPhrase ? `, ${trendPhrase} respecto a ${f.previousQuarter}.` : ".";
        if (f.topVendor && f.topProduct) {
          s += ` El producto más afectado fue ${f.topVendor} / ${f.topProduct} (${f.topVendorCount} CVEs)`;
          s += f.topCweName ? `, y el tipo de debilidad más común fue ${f.topCweName}.` : ".";
        } else if (f.topCweName) {
          s += ` El tipo de debilidad más común fue ${f.topCweName}.`;
        }
        return s;
      },
      downloadExcel: "Descargar Excel",
      downloadPdf: "Descargar PDF",
      loadError: "No se pudo cargar el resumen trimestral.",
      selectQuarter: "Trimestre",
      kpiTotal: "Total de CVEs",
      kpiCritical: "CVEs críticos",
      kpiChange: "vs. trimestre anterior",
      kpiNoChange: "Sin cambios significativos",
      printFooter: "NVD Vulnerability Dashboard — reporte auto-generado, no reemplaza la revisión completa de cada advisory.",
    },
    comparator: {
      title: "Comparador de vendors",
      description: "Agregá entre 2 y 4 vendors/productos para comparar su tendencia de CVEs lado a lado — útil para decisiones de riesgo de proveedores.",
      placeholder: "Buscá un vendor o producto para agregar…",
      addedCount: (count, max) => `${count} de ${max} agregados`,
      alreadyAdded: "Ya agregado",
      needTwo: "Agregá al menos 2 para comparar",
      colVendor: "Vendor / producto",
      colTotal: "Total de CVEs",
      colCritical: "% críticos",
      remove: "Quitar",
      loadError: "No se pudo cargar la comparación.",
    },
  },
};
