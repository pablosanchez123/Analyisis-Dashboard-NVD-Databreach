// Shared Recharts styling so every chart reads as one system.
// Values are CSS custom properties resolved at paint time — swap the tokens
// in index.css, not here, to retheme.
import type { CSSProperties } from "react";

export const tooltipContentStyle: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "8px 12px",
  fontSize: 13,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export const tooltipLabelStyle: CSSProperties = {
  color: "var(--foreground)",
  fontWeight: 600,
  marginBottom: 4,
};

export const tooltipItemStyle: CSSProperties = {
  color: "var(--muted-foreground)",
};

export const axisTickStyle = {
  fill: "var(--chart-muted)",
  fontSize: 12,
};

export const gridColor = "var(--chart-gridline)";

export const SEVERITY_COLORS = {
  CRITICAL: "var(--status-critical)",
  HIGH: "var(--status-serious)",
  MEDIUM: "var(--status-warning)",
  LOW: "var(--status-good)",
} as const;
