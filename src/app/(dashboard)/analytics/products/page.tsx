"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell, ExportButton } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton } from "@/components/common/Skeletons";
import { formatCurrency, formatNumber, downloadCSV } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ProductsAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [datePreset, setDatePreset] = useState("30d");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/products?days=${days}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleExport = () => {
    if (!data?.products) return;
    const rows = data.products.map((p: any) => `${p.product},${p.sku},${p.category},${p.revenue},${p.units},${p.margin},${p.growth}`);
    downloadCSV(["product,sku,category,revenue,units,margin,growth", ...rows].join("\n"), "products_export.csv");
  };

  const filteredProducts = (data?.products || [])
    .filter((p: any) => p.product.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => (sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <span className="text-muted-foreground/30">↕</span>;
    return <span className="text-primary">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <AnalyticsPageShell
      title="Product Performance"
      description="SKU-level revenue, gross margin, unit economics, and growth trends."
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Revenue by Category</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <BarChartWidget data={data?.byCategory || []} xKey="category"
              bars={[{ key: "revenue", label: "Revenue", color: "#6366f1" }, { key: "units", label: "Units", color: "#06b6d4" }]}
              format="number" height={192} />}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Category Revenue Share</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> :
            <DonutChartWidget data={(data?.byCategory || []).map((c: any) => ({ name: c.category, value: c.revenue }))} format="currency" height={200} />}
        </div>
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">All Products</h2>
          <div className="flex items-center gap-2">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 w-48"
            />
            <ExportButton onExport={handleExport} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { label: "Product", key: null },
                  { label: "SKU", key: null },
                  { label: "Category", key: null },
                  { label: "Revenue", key: "revenue" },
                  { label: "Units", key: "units" },
                  { label: "Avg Price", key: "avgPrice" },
                  { label: "Margin", key: "margin" },
                  { label: "Growth", key: "growth" },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={key ? () => handleSort(key) : undefined}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                      key && "cursor-pointer hover:text-foreground transition-colors select-none"
                    )}
                  >
                    {label} {key && <SortIcon col={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td></tr>
              )) : filteredProducts.map((p: any) => {
                const GrowthIcon = p.growth > 0 ? TrendingUp : p.growth < 0 ? TrendingDown : Minus;
                return (
                  <tr key={p.sku} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.product}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{p.category}</span></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(p.revenue, "USD", true)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(p.units)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatCurrency(p.avgPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("font-medium text-xs", p.margin > 70 ? "text-emerald-600 dark:text-emerald-400" : p.margin < 50 ? "text-amber-500" : "")}>
                        {p.margin?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-0.5 text-xs font-medium", p.growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                        <GrowthIcon className="h-3 w-3" />
                        {p.growth >= 0 ? "+" : ""}{p.growth?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AnalyticsPageShell>
  );
}
