import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const prevStart = startOfDay(subDays(now, days * 2));

    const [currentUsers, prevUsers, currentSessions, prevSessions,
           currentConversions, prevConversions, currentBounce, prevBounce] = await Promise.all([
      prisma.analyticsRecord.aggregate({ where: { metric: "active_users", date: { gte: startDate } }, _avg: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "active_users", date: { gte: prevStart, lt: startDate } }, _avg: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "sessions", date: { gte: startDate }, category: "overall" }, _sum: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "sessions", date: { gte: prevStart, lt: startDate }, category: "overall" }, _sum: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "conversions", date: { gte: startDate } }, _sum: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "conversions", date: { gte: prevStart, lt: startDate } }, _sum: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "bounce_rate", date: { gte: startDate } }, _avg: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "bounce_rate", date: { gte: prevStart, lt: startDate } }, _avg: { value: true } }),
    ]);

    // Daily trend (users + sessions)
    const dailyData = await prisma.analyticsRecord.findMany({
      where: { metric: { in: ["active_users", "sessions"] }, date: { gte: startDate }, category: "overall" },
      orderBy: { date: "asc" },
    });

    const byDay: Record<string, { users: number; sessions: number }> = {};
    dailyData.forEach((r) => {
      const key = format(new Date(r.date), "MMM d");
      if (!byDay[key]) byDay[key] = { users: 0, sessions: 0 };
      if (r.metric === "active_users") byDay[key].users = Math.round(r.value);
      if (r.metric === "sessions") byDay[key].sessions = Math.round(r.value);
    });
    const trendData = Object.entries(byDay).map(([date, v]) => ({ date, ...v }));

    // Traffic by source
    const trafficSources = await prisma.analyticsRecord.groupBy({
      by: ["source"],
      where: { metric: "sessions", category: "channel", date: { gte: startDate }, source: { not: null } },
      _sum: { value: true },
      orderBy: { _sum: { value: "desc" } },
    });

    function pct(cur: number, prev: number) {
      if (!prev) return 0;
      return Math.round(((cur - prev) / prev) * 1000) / 10;
    }

    const au = currentUsers._avg.value || 0;
    const pau = prevUsers._avg.value || 0;
    const sess = currentSessions._sum.value || 0;
    const psess = prevSessions._sum.value || 0;
    const conv = currentConversions._sum.value || 0;
    const pconv = prevConversions._sum.value || 0;
    const bounce = currentBounce._avg.value || 0;
    const pbounce = prevBounce._avg.value || 0;
    const convRate = sess ? Math.round((conv / sess) * 10000) / 100 : 0;
    const prevConvRate = psess ? Math.round((pconv / psess) * 10000) / 100 : 0;

    return NextResponse.json({
      kpis: {
        activeUsers: { label: "Avg. Daily Users", value: Math.round(au), changePercent: pct(au, pau), trend: au >= pau ? "up" : "down", format: "number" },
        sessions: { label: "Total Sessions", value: Math.round(sess), changePercent: pct(sess, psess), trend: sess >= psess ? "up" : "down", format: "number" },
        conversionRate: { label: "Conversion Rate", value: convRate, changePercent: pct(convRate, prevConvRate), trend: convRate >= prevConvRate ? "up" : "down", format: "percent" },
        bounceRate: { label: "Bounce Rate", value: Math.round(bounce * 10) / 10, changePercent: pct(bounce, pbounce), trend: bounce <= pbounce ? "up" : "down", format: "percent" },
      },
      trendData,
      trafficSources: trafficSources.map((t) => ({ source: t.source || "Unknown", sessions: Math.round(t._sum.value || 0) })),
    });
  } catch (err) {
    console.error("[USERS_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
