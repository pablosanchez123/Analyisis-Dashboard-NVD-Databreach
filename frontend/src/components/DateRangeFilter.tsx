import { useState } from "react";
import { Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { ALL_TIME, type DateRange } from "@/types/dateRange";

type PresetKey = "all" | "90d" | "12m" | "2y" | "ytd" | "custom";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(key: PresetKey): DateRange {
  const now = new Date();
  switch (key) {
    case "90d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { startDate: isoDate(start), endDate: null };
    }
    case "12m": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { startDate: isoDate(start), endDate: null };
    }
    case "2y": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 2);
      return { startDate: isoDate(start), endDate: null };
    }
    case "ytd":
      return { startDate: `${now.getFullYear()}-01-01`, endDate: null };
    case "all":
    default:
      return ALL_TIME;
  }
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { t } = useLanguage();
  const [activePreset, setActivePreset] = useState<PresetKey>("all");
  const [showCustom, setShowCustom] = useState(false);

  const presets: { key: PresetKey; label: string }[] = [
    { key: "all", label: t.filters.allTime },
    { key: "90d", label: t.filters.last90Days },
    { key: "12m", label: t.filters.last12Months },
    { key: "2y", label: t.filters.last2Years },
    { key: "ytd", label: t.filters.yearToDate },
  ];

  function selectPreset(key: PresetKey) {
    setActivePreset(key);
    setShowCustom(false);
    onChange(presetRange(key));
  }

  function selectCustom() {
    setActivePreset("custom");
    setShowCustom(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Calendar className="size-3.5" />
        {t.filters.label}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => selectPreset(p.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activePreset === p.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {activePreset === p.key && <Check className="size-3" />}
            {p.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={selectCustom}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            activePreset === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          {activePreset === "custom" && <Check className="size-3" />}
          {t.filters.custom}
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={value.startDate ?? ""}
            onChange={(e) => onChange({ ...value, startDate: e.target.value || null })}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
          />
          <span className="text-muted-foreground">{t.filters.to}</span>
          <input
            type="date"
            value={value.endDate ?? ""}
            onChange={(e) => onChange({ ...value, endDate: e.target.value || null })}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
          />
        </div>
      )}
    </div>
  );
}
