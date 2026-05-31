"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { KPIMetric } from "@/types";

interface KPICardProps {
  metric: KPIMetric;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

function useCountUp(target: number, duration = 1200, format: string) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const start = 0;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

function SparkLine({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case "currency": return formatCurrency(value, "USD", true);
    case "number": return formatNumber(value, true);
    case "percent": return formatPercent(value);
    case "duration": {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}m ${secs}s`;
    }
    default: return String(value);
  }
}

export function KPICard({ metric, icon: Icon, className }: KPICardProps) {
  const animated = useCountUp(metric.value, 1200, metric.format);
  const isPositive = metric.trend === "up";
  const isNegative = metric.trend === "down";

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  // For bounce rate, negative trend is actually good
  const isBounceRate = metric.label.toLowerCase().includes("bounce");
  const effectivelyPositive = isBounceRate ? !isPositive : isPositive;
  const effectivelyNegative = isBounceRate ? !isNegative : isNegative;

  return (
    <div className={cn(
      "group rounded-xl border border-border bg-card p-5 transition-all duration-200",
      "hover:border-border/80 hover:shadow-md hover:shadow-black/5",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {metric.label}
        </p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {formatValue(animated, metric.format)}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-xs font-medium",
              effectivelyPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              effectivelyNegative && "bg-red-500/10 text-red-600 dark:text-red-400",
              !effectivelyPositive && !effectivelyNegative && "bg-zinc-500/10 text-zinc-500",
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>
                {metric.changePercent > 0 ? "+" : ""}{metric.changePercent.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        </div>

        {metric.sparkline && (
          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
            <SparkLine data={metric.sparkline} positive={effectivelyPositive || (!effectivelyPositive && !effectivelyNegative)} />
          </div>
        )}
      </div>
    </div>
  );
}

export function KPIGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
