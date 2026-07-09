import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "default" | "critical";
}

export function StatTile({ label, value, sublabel, accent = "default" }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-4xl font-semibold tracking-tight",
          accent === "critical" ? "text-[var(--status-critical)]" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sublabel && <p className="mt-1 text-sm text-muted-foreground">{sublabel}</p>}
    </motion.div>
  );
}
