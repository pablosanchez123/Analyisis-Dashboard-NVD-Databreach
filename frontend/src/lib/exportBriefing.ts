import type { BriefingResponse } from "@/types/briefing";
import type { Language } from "@/i18n/translations";

// exceljs is ~1MB — dynamically imported so it only loads when the user
// actually clicks "Download Excel", not bundled into the initial page load.

const HEADER_FILL = "FF2A78D6"; // --series-1 blue (ARGB)
const HEADER_FONT = "FFFFFFFF";
const NUMBER_FILL = "FFCDE2FB"; // sequential blue step 100
const BORDER_COLOR = "FFC3C2B7"; // --chart-baseline

const LABELS: Record<Language, Record<string, string>> = {
  en: {
    title: "Quarterly Briefing",
    metric: "Metric",
    value: "Value",
    quarter: "Quarter",
    previousQuarter: "Previous quarter",
    totalCves: "Total CVEs",
    criticalCves: "Critical CVEs",
    pctChange: "% change vs previous quarter",
    topVendor: "Top vendor",
    topProduct: "Top product",
    topVendorCount: "Top vendor CVE count",
    topCweId: "Top weakness type (CWE ID)",
    topCweName: "Top weakness type (name)",
    generatedOn: "Generated on",
    source: "Source: NVD Vulnerability Dashboard",
  },
  es: {
    title: "Resumen Trimestral",
    metric: "Métrica",
    value: "Valor",
    quarter: "Trimestre",
    previousQuarter: "Trimestre anterior",
    totalCves: "Total de CVEs",
    criticalCves: "CVEs críticos",
    pctChange: "% cambio vs trimestre anterior",
    topVendor: "Vendor principal",
    topProduct: "Producto principal",
    topVendorCount: "CVEs del vendor principal",
    topCweId: "Tipo de debilidad principal (CWE ID)",
    topCweName: "Tipo de debilidad principal (nombre)",
    generatedOn: "Generado el",
    source: "Fuente: NVD Vulnerability Dashboard",
  },
};

export async function exportBriefingToExcel(data: BriefingResponse, language: Language) {
  const ExcelJS = (await import("exceljs")).default;
  const l = LABELS[language];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NVD Vulnerability Dashboard";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(l.title);
  sheet.columns = [
    { key: "metric", width: 34 },
    { key: "value", width: 40 },
  ];

  // Title banner (merged across both columns)
  sheet.mergeCells("A1:B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${l.title} — ${data.quarter}`;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF0B0B0B" } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:B2");
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = `${l.generatedOn} ${new Date().toLocaleDateString(language === "es" ? "es-AR" : "en-US")} · ${l.source}`;
  subtitleCell.font = { italic: true, size: 10, color: { argb: "FF898781" } };
  sheet.addRow([]);

  const headerRow = sheet.addRow([l.metric, l.value]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 12 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: BORDER_COLOR } },
      bottom: { style: "thin", color: { argb: BORDER_COLOR } },
      left: { style: "thin", color: { argb: BORDER_COLOR } },
      right: { style: "thin", color: { argb: BORDER_COLOR } },
    };
  });

  const rows: Array<[string, string | number]> = [
    [l.quarter, data.quarter],
    [l.previousQuarter, data.previous_quarter],
    [l.totalCves, data.total_cves],
    [l.criticalCves, data.critical_cves],
    [l.pctChange, data.pct_change_vs_previous != null ? `${data.pct_change_vs_previous}%` : "—"],
    [l.topVendor, data.top_vendor ?? "—"],
    [l.topProduct, data.top_product ?? "—"],
    [l.topVendorCount, data.top_vendor_cve_count],
    [l.topCweId, data.top_cwe_id ?? "—"],
    [l.topCweName, data.top_cwe_name ?? "—"],
  ];

  rows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    const [labelCell, valueCell] = row.getCell(1) ? [row.getCell(1), row.getCell(2)] : [];
    if (labelCell) {
      labelCell.font = { size: 11 };
      labelCell.border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
      };
    }
    if (valueCell) {
      const isNumber = typeof value === "number";
      valueCell.font = { bold: isNumber, size: 11, color: { argb: isNumber ? "FF184F95" : "FF0B0B0B" } };
      if (isNumber) {
        valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NUMBER_FILL } };
      }
      valueCell.border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nvd-briefing-${data.quarter}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
