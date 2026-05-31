"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber, formatCurrency } from "@/lib/utils";

const CHART_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6",
];

interface DonutData {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DonutData[];
  format?: "currency" | "number" | "percent";
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

const CustomTooltip = ({ active, payload, format }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.payload.fill }} />
        <span className="text-xs font-medium">{d.name}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {format === "currency" ? formatCurrency(d.value, "INR", true) : formatNumber(d.value, true)}
        {" "}({((d.value / payload.reduce((s: any, p: any) => s + p.value, 0)) * 100).toFixed(1)}%)
      </p>
    </div>
  );
};

export function DonutChartWidget({
  data, format = "number", height = 240,
  innerRadius = 60, outerRadius = 90, showLegend = true
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip format={format} />} />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => (
                <span className="text-muted-foreground">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutChartWithCenterProps extends DonutChartProps {
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChartWithCenter({
  data, format = "number", height = 200,
  innerRadius = 65, outerRadius = 85,
  centerLabel, centerValue,
}: DonutChartWithCenterProps) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip format={format} />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <p className="text-xl font-bold">{centerValue}</p>}
          {centerLabel && <p className="text-xs text-muted-foreground mt-0.5">{centerLabel}</p>}
        </div>
      )}
    </div>
  );
}
