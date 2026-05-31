"use client";

import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CHART_COLORS_ARRAY = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6", "#ef4444", "#3b82f6",
];

const CustomTooltip = ({ active, payload, label, format }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-medium text-xs mb-2 text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {format === "currency" ? formatCurrency(p.value, "INR", true) :
             format === "percent" ? `${p.value.toFixed(1)}%` :
             formatNumber(p.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
};

interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  bars: { key: string; label: string; color?: string }[];
  format?: "currency" | "number" | "percent";
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
}

export function BarChartWidget({
  data, xKey, bars, format = "number", height = 240, horizontal = false, stacked = false
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 4, left: horizontal ? 80 : -16, bottom: 0 }}
        barGap={4}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => format === "currency" ? formatCurrency(v, "INR", true) : formatNumber(v, true)}
            />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => format === "currency" ? formatCurrency(v, "INR", true) : format === "percent" ? `${v}%` : formatNumber(v, true)}
            />
          </>
        )}
        <Tooltip content={<CustomTooltip format={format} />} />
        {bars.length > 1 && (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        )}
        {bars.map((bar, i) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color || CHART_COLORS_ARRAY[i]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Single-bar chart with per-bar colors
export function MultiColorBarChart({ data, xKey, valueKey, format = "number", height = 240 }: {
  data: Record<string, string | number>[];
  xKey: string;
  valueKey: string;
  format?: "currency" | "number" | "percent";
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => format === "currency" ? formatCurrency(v, "USD", true) : formatNumber(v, true)}
        />
        <Tooltip content={<CustomTooltip format={format} />} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length]} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
