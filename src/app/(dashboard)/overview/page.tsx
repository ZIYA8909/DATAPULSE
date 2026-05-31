"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, Users, MousePointerClick, Activity,
  TrendingUp, ExternalLink, ArrowUpRight,
} from "lucide-react";
import { KPICard, KPIGrid } from "@/components/dashboard/KPICard";
import { AreaChartWidget } from "@/components/charts/AreaChart";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { LineChartWidget } from "@/components/charts/LineChart";
import { KPICardSkeleton, ChartSkeleton } from "@/components/common/Skeletons";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { KPIMetric } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "signed in",
  LOGOUT: "signed out",
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  EXPORT: "exported",
  IMPORT: "imported",
  VIEW: "viewed",
  SHARE: "shared",
};

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpiIcons = {
    revenue: DollarSign,
    activeUsers: Users,
    conversions: MousePointerClick,
    sessions: Activity,
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Last 30 days performance across all metrics. Updated daily.
        </p>
      </div>

      {/* KPI Cards */}
      <KPIGrid>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          : data?.kpis
          ? Object.entries(data.kpis).map(([key, metric]) => (
              <KPICard
                key={key}
                metric={metric as KPIMetric}
                icon={kpiIcons[key as keyof typeof kpiIcons]}
              />
            ))
          : null}
      </KPIGrid>

      {/* Main charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Revenue trend (wider) */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue over the last 12 months</p>
            </div>
            <Link href="/analytics/revenue" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Full report <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton h-56 rounded-lg" />
          ) : (
            <AreaChartWidget
              data={data?.revenueTrend || []}
              xKey="month"
              lines={[{ key: "revenue", label: "Revenue", color: "#6366f1" }]}
              format="currency"
              height={220}
            />
          )}
        </div>

        {/* Traffic sources */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Traffic Sources</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Session distribution by channel</p>
            </div>
          </div>
          {loading ? (
            <div className="skeleton h-56 rounded-lg" />
          ) : (
            <>
              <DonutChartWidget
                data={data?.trafficData || []}
                format="number"
                height={180}
                showLegend={false}
              />
              <div className="space-y-1.5">
                {(data?.trafficData || []).slice(0, 4).map((item: any, i: number) => {
                  const total = (data?.trafficData || []).reduce((s: number, d: any) => s + d.value, 0);
                  const pct = total ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b"];
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: colors[i] }} />
                      <span className="flex-1 text-xs text-muted-foreground truncate">{item.name}</span>
                      <span className="text-xs font-medium tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Second row: Regional bar + User growth */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by region */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue by Region</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
            <Link href="/analytics/regional" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Regional report <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <BarChartWidget
              data={data?.regionData || []}
              xKey="region"
              bars={[{ key: "revenue", label: "Revenue", color: "#06b6d4" }]}
              format="currency"
              height={192}
            />
          )}
        </div>

        {/* User growth */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Active User Growth</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Daily average users per month</p>
            </div>
            <Link href="/analytics/users" className="flex items-center gap-1 text-xs text-primary hover:underline">
              User analytics <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <LineChartWidget
              data={data?.userTrend || []}
              xKey="month"
              lines={[{ key: "users", label: "Avg. Daily Users", color: "#10b981" }]}
              format="number"
              height={192}
            />
          )}
        </div>
      </div>

      {/* Bottom row: Top products + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Top products */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Top Products by Revenue</h2>
            <Link href="/analytics/products" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 rounded" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(data?.topProducts || []).map((p: any, i: number) => {
                const maxRevenue = data.topProducts[0]?.revenue || 1;
                const pct = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={p.product} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <span className="w-5 text-xs font-medium text-muted-foreground">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.product}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.revenue, "USD", true)}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(p.units)} units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <Link href="/activity" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(data?.recentActivity || []).map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium">{a.userName}</span>
                      {" "}{ACTION_LABELS[a.action] || a.action}{" "}
                      {a.entityName && <span className="text-muted-foreground">{a.entityName}</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
