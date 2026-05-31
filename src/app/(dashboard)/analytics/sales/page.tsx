"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell, ExportButton } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { AreaChartWidget } from "@/components/charts/AreaChart";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton, ChartSkeleton } from "@/components/common/Skeletons";
import { NoDataState } from "@/components/common/EmptyStates";
import { formatCurrency, formatNumber, formatDate, downloadCSV } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Online: "#6366f1",
  "Enterprise Direct": "#06b6d4",
  "Channel Partner": "#10b981",
  Marketplace: "#f59e0b",
};

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [datePreset, setDatePreset] = useState("30d");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/sales?days=${days}&page=${page}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [days, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDateChange = (preset: string, d: number) => {
    setDatePreset(preset);
    setDays(d);
    setPage(1);
  };

  const handleExport = () => {
    if (!data?.table?.items) return;
    const rows = data.table.items.map((r: any) =>
      [r.date, r.product, r.sku, r.channel, r.region, r.revenue, r.units, r.margin].join(",")
    );
    downloadCSV(["date,product,sku,channel,region,revenue,units,margin", ...rows].join("\n"), "sales_export.csv");
  };

  return (
    <AnalyticsPageShell
      title="Sales Analytics"
      description="Revenue, deal volume, and sales rep performance across all channels."
      days={days}
      datePreset={datePreset}
      onDateChange={handleDateChange}
      onExport={handleExport}
    >
      {/* KPIs */}
      <MetricGrid>
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) :
          data?.kpis ? Object.entries(data.kpis).map(([key, m]: any) => (
            <MetricCard key={key} label={m.label} value={m.value} changePercent={m.changePercent} trend={m.trend} format={m.format} />
          )) : null}
      </MetricGrid>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Revenue Trend</h2>
            <p className="text-xs text-muted-foreground">Daily revenue over selected period</p>
          </div>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <AreaChartWidget data={data?.trendData || []} xKey="date" lines={[{ key: "revenue", label: "Revenue", color: "#6366f1" }, { key: "units", label: "Units", color: "#06b6d4" }]} format="number" height={210} />}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Revenue by Channel</h2>
            <p className="text-xs text-muted-foreground">Share of revenue per channel</p>
          </div>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <DonutChartWidget data={(data?.byChannel || []).map((c: any) => ({ name: c.channel, value: c.revenue }))} format="currency" height={210} />}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Revenue by Product Category</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <BarChartWidget data={data?.byCategory || []} xKey="category" bars={[{ key: "revenue", label: "Revenue", color: "#10b981" }]} format="currency" height={192} />}
        </div>

        {/* Sales rep leaderboard */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Top Sales Representatives</h2>
          </div>
          {loading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div> : (
            <div className="divide-y divide-border">
              {(data?.bySalesRep || []).slice(0, 8).map((rep: any, i: number) => {
                const max = data.bySalesRep[0]?.revenue || 1;
                return (
                  <div key={rep.rep} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-xs text-muted-foreground font-medium">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{rep.rep}</p>
                        <p className="text-sm font-semibold tabular-nums ml-2">{formatCurrency(rep.revenue, "USD", true)}</p>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(rep.revenue / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{rep.deals} deals</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Transaction Detail</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {data?.table?.total ? `${data.table.total} records` : ""}
            </span>
            <ExportButton onExport={handleExport} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Date", "Product", "SKU", "Channel", "Region", "Revenue", "Units", "Margin"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
              )) : (data?.table?.items || []).map((row: any) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(row.date, "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{row.product}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sku}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{row.channel}</span></td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.region}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatNumber(row.units)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className={cn("font-medium", row.margin > 60 ? "text-emerald-600 dark:text-emerald-400" : row.margin < 40 ? "text-amber-500" : "")}>
                      {row.margin?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data?.table && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Page {data.table.page} of {data.table.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(data.table.totalPages, p + 1))} disabled={page >= data.table.totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AnalyticsPageShell>
  );
}
