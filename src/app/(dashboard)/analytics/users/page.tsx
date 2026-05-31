"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { MetricCard, MetricGrid } from "@/components/analytics/MetricCard";
import { LineChartWidget } from "@/components/charts/LineChart";
import { BarChartWidget } from "@/components/charts/BarChart";
import { DonutChartWidget } from "@/components/charts/DonutChart";
import { KPICardSkeleton } from "@/components/common/Skeletons";
import { downloadCSV } from "@/lib/utils";

export default function UsersAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [datePreset, setDatePreset] = useState("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/users?days=${days}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.trendData) return;
    const rows = data.trendData.map((r: any) => `${r.date},${r.users},${r.sessions}`);
    downloadCSV(["date,users,sessions", ...rows].join("\n"), "users_export.csv");
  };

  return (
    <AnalyticsPageShell
      title="User Engagement"
      description="Daily active users, session metrics, conversion funnel, and acquisition channels."
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

      {/* User + Sessions trend */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Users & Sessions Trend</h2>
          <p className="text-xs text-muted-foreground">Daily activity over selected period</p>
        </div>
        {loading ? <div className="skeleton h-56 rounded-lg" /> :
          <LineChartWidget data={data?.trendData || []} xKey="date"
            lines={[{ key: "users", label: "Active Users", color: "#6366f1" }, { key: "sessions", label: "Sessions", color: "#10b981" }]}
            format="number" height={224} />}
      </div>

      {/* Traffic sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Traffic by Source</h2>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <BarChartWidget
              data={data?.trafficSources || []}
              xKey="source" bars={[{ key: "sessions", label: "Sessions", color: "#8b5cf6" }]}
              format="number" horizontal height={210} />}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Source Distribution</h2>
          {loading ? <div className="skeleton h-52 rounded-lg" /> :
            <DonutChartWidget
              data={(data?.trafficSources || []).map((s: any) => ({ name: s.source, value: s.sessions }))}
              format="number" height={210} />}
        </div>
      </div>

      {/* Engagement Insights Panel */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">AI Insights</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { title: "Organic Search Dominance", body: "Organic search accounts for 38% of all sessions, indicating strong SEO performance. Consider expanding content strategy to maintain momentum." },
            { title: "Weekend Dip Detected", body: "Session volume drops ~40% on weekends. This is typical for B2B products. Scheduling campaigns for Monday–Thursday will maximize reach." },
            { title: "Conversion Rate Improving", body: "Conversion rate has improved by 2.4% over the last 90 days. The recent landing page optimization appears to be driving results." },
          ].map((insight) => (
            <div key={insight.title} className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <p className="text-xs font-semibold">{insight.title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsPageShell>
  );
}
