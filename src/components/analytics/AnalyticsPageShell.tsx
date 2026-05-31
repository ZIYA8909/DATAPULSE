"use client";

import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATE_PRESETS } from "@/lib/constants";
import { toast } from "sonner";

interface DateRangePickerProps {
  value: string;
  onChange: (v: string, days: number) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      {DATE_PRESETS.filter((p) => p.days > 0).map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value, preset.days)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === preset.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {preset.label.replace("Last ", "").replace(" months", "mo").replace(" days", "d")}
        </button>
      ))}
    </div>
  );
}

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
}

export function ExportButton({ onExport, label = "Export CSV" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    onExport();
    toast.success("Export ready", { description: "Your CSV file has been downloaded." });
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
    >
      <Download className={cn("h-3.5 w-3.5", loading && "animate-bounce")} />
      {loading ? "Preparing..." : label}
    </button>
  );
}

interface AnalyticsPageShellProps {
  title: string;
  description: string;
  days: number;
  datePreset: string;
  onDateChange: (preset: string, days: number) => void;
  onExport?: () => void;
  children: React.ReactNode;
}

export function AnalyticsPageShell({
  title,
  description,
  days,
  datePreset,
  onDateChange,
  onExport,
  children,
}: AnalyticsPageShellProps) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={datePreset} onChange={onDateChange} />
          {onExport && <ExportButton onExport={onExport} />}
        </div>
      </div>
      {children}
    </div>
  );
}
