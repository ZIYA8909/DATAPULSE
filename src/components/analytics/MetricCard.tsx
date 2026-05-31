"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  changePercent?: number;
  trend?: "up" | "down" | "neutral";
  format?: "currency" | "number" | "percent";
  className?: string;
  size?: "sm" | "md";
}

function formatVal(value: number, format: string): string {
  if (format === "currency") return formatCurrency(value, "USD", true);
  if (format === "percent") return formatPercent(value);
  if (format === "number") return formatNumber(value, true);
  return String(value);
}

export function MetricCard({
  label, value, changePercent = 0, trend = "neutral", format = "number", className, size = "md"
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600 dark:text-emerald-400" :
                     trend === "down" ? "text-red-500 dark:text-red-400" : "text-zinc-400";
  const trendBg = trend === "up" ? "bg-emerald-500/10" :
                  trend === "down" ? "bg-red-500/10" : "bg-zinc-500/10";

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-all",
      className
    )}>
      <p className={cn("text-xs font-medium uppercase tracking-wide text-muted-foreground", size === "sm" && "text-[11px]")}>
        {label}
      </p>
      <p className={cn("mt-2 font-bold tabular-nums", size === "md" ? "text-2xl" : "text-lg")}>
        {formatVal(value, format)}
      </p>
      {changePercent !== undefined && (
        <div className={cn("mt-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5", trendBg)}>
          <TrendIcon className={cn("h-3 w-3", trendColor)} />
          <span className={cn("text-xs font-medium", trendColor)}>
            {changePercent > 0 ? "+" : ""}{changePercent.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function MetricGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cn(
      "grid grid-cols-1 gap-4",
      cols === 2 && "sm:grid-cols-2",
      cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
      cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
    )}>
      {children}
    </div>
  );
}
