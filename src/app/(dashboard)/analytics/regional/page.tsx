"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton } from "@/components/common/Skeletons";
import { formatCurrency, formatNumber, downloadCSV } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Globe } from "lucide-react";

const REGION_FLAGS: Record<string, string> = {
  "North America": "🌎",
  "Europe": "🌍",
  "Asia Pacific": "🌏",
  "Latin America": "🌎",
  "Middle East & Africa": "🌍",
};

export default function RegionalAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [datePreset, setDatePreset] = useState("30d");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/regional?days=${days}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.regions) return;
    const rows = data.regions.map((r: any) => `${r.region},${r.revenue},${r.units},${r.deals},${r.growth}`);
    downloadCSV(["region,revenue,units,deals,growth", ...rows].join("\n"), "regional_export.csv");
  };

  const filteredCountries = selectedRegion
    ? (data?.byCountry || []).filter((c: any) => c.region === selectedRegion)
    : (data?.byCountry || []);

  return (
    <AnalyticsPageShell
      title="Regional Performance"
      description="Revenue, deal volume, and growth across geographic regions and countries."
      days={days} datePreset={datePreset}
      onDateChange={(p, d) => { setDatePreset(p); setDays(d); }}
      onExport={handleExport}
    >
      <MetricGrid>
        {loading ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />) :
          data?.kpis ? Object.entries(data.kpis).map(([key, m]: any) => (
            <MetricCard key={key} label={m.label} value={typeof m.value === "number" ? Math.round(m.value) : m.value} changePercent={m.changePercent} trend={m.trend} format={m.format} />
          )) : null}
      </MetricGrid>

      {/* Region cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Performance by Region</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />) :
            (data?.regions || []).map((r: any) => {
              const isSelected = selectedRegion === r.region;
              return (
                <button
                  key={r.region}
                  onClick={() => setSelectedRegion(isSelected ? null : r.region)}
                  className={cn(
                    "rounded-xl border p-4 text-left space-y-2 transition-all hover:shadow-md",
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-border/80"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{REGION_FLAGS[r.region] || "🌐"}</span>
                    <span className={cn("flex items-center gap-0.5 text-xs font-semibold",
                      r.growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      {r.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {r.growth >= 0 ? "+" : ""}{r.growth?.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground truncate">{r.region}</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(r.revenue, "USD", true)}</p>
                    <p className="text-xs text-muted-foreground">{r.deals} deals · {formatNumber(r.units)} units</p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Regional Revenue Comparison</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <BarChartWidget
              data={data?.regions || []}
              xKey="region"
              bars={[{ key: "revenue", label: "Revenue", color: "#6366f1" }]}
              format="currency" height={192} />}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Revenue Distribution</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <DonutChartWidget
              data={(data?.regions || []).map((r: any) => ({ name: r.region.split(" ")[0], value: r.revenue }))}
              format="currency" height={200} />}
        </div>
      </div>

      {/* Country table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">
            Country Breakdown {selectedRegion && <span className="ml-2 text-xs text-primary font-normal">({selectedRegion})</span>}
          </h2>
          {selectedRegion && (
            <button onClick={() => setSelectedRegion(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Clear filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Country", "Region", "Revenue", "Units"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
              )) : filteredCountries.map((c: any) => (
                <tr key={`${c.country}-${c.region}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.country}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.region}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(c.revenue, "USD", true)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatNumber(c.units)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AnalyticsPageShell>
  );
}
