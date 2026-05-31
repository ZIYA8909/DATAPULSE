"use client";

import {
  AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/constants";

interface DataPoint {
  [key: string]: string | number;
}

interface AreaChartProps {
  data: DataPoint[];
  xKey: string;
  lines: { key: string; label: string; color?: string }[];
  format?: "currency" | "number" | "percent";
  height?: number;
  gradient?: boolean;
}

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

export function AreaChartWidget({ data, xKey, lines, format = "number", height = 240, gradient = true }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          {lines.map((line, i) => (
            <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={line.color || CHART_COLORS_ARRAY[i]} stopOpacity={0.15} />
              <stop offset="95%" stopColor={line.color || CHART_COLORS_ARRAY[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "currentColor", className: "text-muted-foreground" }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor", className: "text-muted-foreground" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            format === "currency" ? formatCurrency(v, "INR", true) :
            format === "percent" ? `${v}%` :
            formatNumber(v, true)
          }
        />
        <Tooltip content={<CustomTooltip format={format} />} />
        {lines.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        )}
        {lines.map((line, i) => {
          const color = line.color || CHART_COLORS_ARRAY[i];
          return (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={color}
              strokeWidth={2}
              fill={gradient ? `url(#grad-${line.key})` : "transparent"}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          );
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

// CHART_COLORS_ARRAY needs to be exported from constants
const CHART_COLORS_ARRAY = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6", "#ef4444", "#3b82f6",
];
