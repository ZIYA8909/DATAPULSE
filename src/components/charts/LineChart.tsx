"use client";

import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";

const CHART_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6",
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

interface LineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  lines: { key: string; label: string; color?: string; dashed?: boolean }[];
  format?: "currency" | "number" | "percent";
  height?: number;
  referenceLine?: number;
  referenceLineLabel?: string;
}

export function LineChartWidget({
  data, xKey, lines, format = "number", height = 240, referenceLine, referenceLineLabel,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
        <YAxis
          tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) =>
            format === "currency" ? formatCurrency(v, "INR", true) :
            format === "percent" ? `${v}%` : formatNumber(v, true)
          }
        />
        <Tooltip content={<CustomTooltip format={format} />} />
        {lines.length > 1 && (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        )}
        {referenceLine !== undefined && (
          <ReferenceLine y={referenceLine} strokeDasharray="6 3" stroke="hsl(var(--muted-foreground))" opacity={0.5}>
          </ReferenceLine>
        )}
        {lines.map((line, i) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color || CHART_COLORS[i]}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "6 3" : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
