"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { AreaChartWidget } from "@/components/charts/AreaChart";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton } from "@/components/common/Skeletons";
import { formatCurrency, formatNumber, downloadCSV } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function RevenueAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [datePreset, setDatePreset] = useState("90d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/revenue?days=${days}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.monthlyRevenue) return;
    const rows = data.monthlyRevenue.map((r: any) => `${r.month},${r.revenue},${r.mrr}`);
    downloadCSV(["month,revenue,mrr", ...rows].join("\n"), "revenue_export.csv");
  };

  return (
    <AnalyticsPageShell
      title="Revenue Analytics"
      description="MRR, ARR, revenue trends and product-level gross margin analysis."
      days={days}
      datePreset={datePreset}
      onDateChange={(p, d) => { setDatePreset(p); setDays(d); }}
      onExport={handleExport}
    >
      {/* KPIs */}
      <MetricGrid>
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) :
          data?.kpis ? Object.entries(data.kpis).map(([key, m]: any) => (
            <MetricCard key={key} label={m.label} value={m.value} changePercent={m.changePercent} trend={m.trend} format={m.format} />
          )) : null}
      </MetricGrid>

      {/* Revenue trend */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Monthly Revenue & MRR</h2>
            <p className="text-xs text-muted-foreground">Last 12 months</p>
          </div>
        </div>
        {loading ? <div className="skeleton h-56 rounded-lg" /> :
          <AreaChartWidget data={data?.monthlyRevenue || []} xKey="month"
            lines={[{ key: "revenue", label: "Revenue", color: "#6366f1" }, { key: "mrr", label: "MRR", color: "#06b6d4" }]}
            format="currency" height={224} />}
      </div>

      {/* Bottom: channel + products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Revenue by Channel</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <DonutChartWidget data={(data?.byChannel || []).map((c: any) => ({ name: c.channel, value: c.revenue }))} format="currency" height={200} />}
        </div>

        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Product Revenue & Margin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Product", "Category", "Revenue", "Gross Profit", "Margin", "Growth"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
                )) : (data?.topProducts || []).map((p: any) => (
                  <tr key={p.product} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">{p.product}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{p.category}</span></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(p.revenue, "USD", true)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(p.grossProfit, "USD", true)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={cn("font-medium", p.margin > 70 ? "text-emerald-600 dark:text-emerald-400" : p.margin < 50 ? "text-amber-500" : "")}>
                        {p.margin?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-0.5 text-xs font-medium", p.growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                        {p.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {p.growth?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnalyticsPageShell>
  );
}
