"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton } from "@/components/common/Skeletons";
import { formatCurrency, formatNumber, formatDate, downloadCSV } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  completed: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  draft: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

export default function MarketingAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [datePreset, setDatePreset] = useState("90d");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/marketing");
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.campaigns) return;
    const rows = data.campaigns.map((c: any) =>
      [c.name, c.channel, c.status, c.budget, c.spend, c.impressions, c.clicks, c.conversions, c.revenue, c.roas].join(",")
    );
    downloadCSV(["name,channel,status,budget,spend,impressions,clicks,conversions,revenue,roas", ...rows].join("\n"), "campaigns_export.csv");
  };

  const filtered = (data?.campaigns || []).filter((c: any) =>
    statusFilter === "all" || c.status === statusFilter
  );

  return (
    <AnalyticsPageShell
      title="Marketing Campaigns"
      description="Campaign performance, ROI analysis, and channel attribution across all marketing activities."
      days={days} datePreset={datePreset}
      onDateChange={(p, d) => { setDatePreset(p); setDays(d); }}
      onExport={handleExport}
    >
      <MetricGrid>
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) :
          data?.kpis ? Object.entries(data.kpis).map(([key, m]: any) => (
            <MetricCard key={key} label={m.label} value={m.value} changePercent={m.changePercent} trend={m.trend} format={m.format} />
          )) : null}
      </MetricGrid>

      {/* Channel charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Revenue & Spend by Channel</h2>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <BarChartWidget
              data={data?.channelData || []} xKey="channel"
              bars={[{ key: "revenue", label: "Revenue", color: "#10b981" }, { key: "spend", label: "Spend", color: "#6366f1" }]}
              format="currency" height={210} />}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">ROAS by Channel</h2>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <BarChartWidget
              data={data?.channelData || []} xKey="channel"
              bars={[{ key: "roas", label: "ROAS", color: "#f59e0b" }]}
              format="number" height={210} />}
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">All Campaigns</h2>
          <div className="flex items-center gap-2">
            {["all", "active", "paused", "completed", "draft"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Campaign", "Channel", "Status", "Budget", "Spend", "Impressions", "CTR", "Conv.", "Revenue", "ROAS"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
              )) : filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.channel}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[c.status] || "bg-muted")}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatCurrency(c.budget, "USD", true)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(c.spend, "USD", true)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatNumber(c.impressions, true)}</td>
                  <td className="px-4 py-3 tabular-nums">{c.ctr?.toFixed(2)}%</td>
                  <td className="px-4 py-3 tabular-nums">{formatNumber(c.conversions)}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(c.revenue, "USD", true)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("font-semibold tabular-nums", c.roas >= 3 ? "text-emerald-600 dark:text-emerald-400" : c.roas < 1.5 ? "text-red-500" : "")}>
                      {c.roas?.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AnalyticsPageShell>
  );
}
