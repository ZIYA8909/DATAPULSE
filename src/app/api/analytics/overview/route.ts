import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const thirtyDaysAgo = startOfDay(subDays(now, 30));
    const sixtyDaysAgo = startOfDay(subDays(now, 60));

    // Current period aggregates
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.analyticsRecord.aggregate({
        where: { metric: "revenue", date: { gte: thirtyDaysAgo } },
        _sum: { value: true },
      }),
      prisma.analyticsRecord.aggregate({
        where: { metric: "revenue", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { value: true },
      }),
    ]);

    const [currentUsers, previousUsers] = await Promise.all([
      prisma.analyticsRecord.aggregate({
        where: { metric: "active_users", date: { gte: thirtyDaysAgo } },
        _avg: { value: true },
      }),
      prisma.analyticsRecord.aggregate({
        where: { metric: "active_users", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _avg: { value: true },
      }),
    ]);

    const [currentConversions, previousConversions] = await Promise.all([
      prisma.analyticsRecord.aggregate({
        where: { metric: "conversions", date: { gte: thirtyDaysAgo } },
        _sum: { value: true },
      }),
      prisma.analyticsRecord.aggregate({
        where: { metric: "conversions", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { value: true },
      }),
    ]);

    const [currentSessions, previousSessions] = await Promise.all([
      prisma.analyticsRecord.aggregate({
        where: { metric: "sessions", date: { gte: thirtyDaysAgo }, category: "overall" },
        _sum: { value: true },
      }),
      prisma.analyticsRecord.aggregate({
        where: { metric: "sessions", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, category: "overall" },
        _sum: { value: true },
      }),
    ]);

    // Revenue trend (last 12 months, monthly)
    const revenueByMonth = await prisma.analyticsRecord.findMany({
      where: {
        metric: "revenue",
        date: { gte: subDays(now, 365) },
        category: "overall",
      },
      orderBy: { date: "asc" },
    });

    const monthlyRevenue: Record<string, number> = {};
    revenueByMonth.forEach((r) => {
      const key = format(new Date(r.date), "MMM yy");
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + r.value;
    });
    const revenueTrend = Object.entries(monthlyRevenue)
      .slice(-12)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

    // User growth trend
    const usersByMonth = await prisma.analyticsRecord.findMany({
      where: { metric: "active_users", date: { gte: subDays(now, 365) } },
      orderBy: { date: "asc" },
    });

    const monthlyUsers: Record<string, { sum: number; count: number }> = {};
    usersByMonth.forEach((r) => {
      const key = format(new Date(r.date), "MMM yy");
      if (!monthlyUsers[key]) monthlyUsers[key] = { sum: 0, count: 0 };
      monthlyUsers[key].sum += r.value;
      monthlyUsers[key].count += 1;
    });
    const userTrend = Object.entries(monthlyUsers)
      .slice(-12)
      .map(([month, { sum, count }]) => ({ month, users: Math.round(sum / count) }));

    // Traffic sources (last 30 days)
    const trafficSources = await prisma.analyticsRecord.groupBy({
      by: ["source"],
      where: {
        metric: "sessions",
        category: "channel",
        date: { gte: thirtyDaysAgo },
        source: { not: null },
      },
      _sum: { value: true },
      orderBy: { _sum: { value: "desc" } },
    });

    const trafficData = trafficSources.map((t) => ({
      name: t.source || "Unknown",
      value: Math.round(t._sum.value || 0),
    }));

    // Sales by region (last 30 days)
    const salesByRegion = await prisma.salesRecord.groupBy({
      by: ["region"],
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { revenue: true },
      orderBy: { _sum: { revenue: "desc" } },
    });

    const regionData = salesByRegion.map((r) => ({
      region: r.region.split(" ")[0], // Shorten for chart
      revenue: Math.round(r._sum.revenue || 0),
    }));

    // Top products (last 30 days)
    const topProducts = await prisma.salesRecord.groupBy({
      by: ["product"],
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { revenue: true, units: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: 5,
    });

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    // Helpers
    function calcChange(current: number, previous: number) {
      if (!previous) return { change: 0, changePercent: 0 };
      const change = current - previous;
      const changePercent = (change / previous) * 100;
      return { change: Math.round(change), changePercent: Math.round(changePercent * 10) / 10 };
    }

    const revenueVal = Math.round(currentRevenue._sum.value || 0);
    const prevRevenueVal = Math.round(previousRevenue._sum.value || 0);
    const usersVal = Math.round(currentUsers._avg.value || 0);
    const prevUsersVal = Math.round(previousUsers._avg.value || 0);
    const convVal = Math.round(currentConversions._sum.value || 0);
    const prevConvVal = Math.round(previousConversions._sum.value || 0);
    const sessionsVal = Math.round(currentSessions._sum.value || 0);
    const prevSessionsVal = Math.round(previousSessions._sum.value || 0);

    const revenueChange = calcChange(revenueVal, prevRevenueVal);
    const usersChange = calcChange(usersVal, prevUsersVal);
    const convChange = calcChange(convVal, prevConvVal);
    const sessionsChange = calcChange(sessionsVal, prevSessionsVal);

    // Sparklines (last 7 daily values)
    async function getSparkline(metric: string, days = 7) {
      const records = await prisma.analyticsRecord.findMany({
        where: { metric, date: { gte: subDays(now, days) }, category: "overall" },
        orderBy: { date: "asc" },
        select: { value: true },
      });
      return records.map((r) => Math.round(r.value));
    }

    const [revSparkline, userSparkline, convSparkline, sessSparkline] = await Promise.all([
      getSparkline("revenue"),
      getSparkline("active_users"),
      getSparkline("conversions"),
      getSparkline("sessions"),
    ]);

    return NextResponse.json({
      kpis: {
        revenue: {
          label: "Revenue (30d)",
          value: revenueVal,
          previousValue: prevRevenueVal,
          ...revenueChange,
          trend: revenueChange.changePercent >= 0 ? "up" : "down",
          format: "currency",
          sparkline: revSparkline,
        },
        activeUsers: {
          label: "Active Users",
          value: usersVal,
          previousValue: prevUsersVal,
          ...usersChange,
          trend: usersChange.changePercent >= 0 ? "up" : "down",
          format: "number",
          sparkline: userSparkline,
        },
        conversions: {
          label: "Conversions",
          value: convVal,
          previousValue: prevConvVal,
          ...convChange,
          trend: convChange.changePercent >= 0 ? "up" : "down",
          format: "number",
          sparkline: convSparkline,
        },
        sessions: {
          label: "Total Sessions",
          value: sessionsVal,
          previousValue: prevSessionsVal,
          ...sessionsChange,
          trend: sessionsChange.changePercent >= 0 ? "up" : "down",
          format: "number",
          sparkline: sessSparkline,
        },
      },
      revenueTrend,
      userTrend,
      trafficData,
      regionData,
      topProducts: topProducts.map((p) => ({
        product: p.product,
        revenue: Math.round(p._sum.revenue || 0),
        units: p._sum.units || 0,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityName: a.entityName,
        userName: a.user.name,
        userRole: a.user.role,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("[OVERVIEW_API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
