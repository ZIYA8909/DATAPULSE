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
    const region = searchParams.get("region") || undefined;
    const channel = searchParams.get("channel") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const prevStartDate = startOfDay(subDays(now, days * 2));

    const where: any = { date: { gte: startDate } };
    const prevWhere: any = { date: { gte: prevStartDate, lt: startDate } };
    if (region) { where.region = region; prevWhere.region = region; }
    if (channel) { where.channel = channel; prevWhere.channel = channel; }

    // KPIs
    const [current, previous] = await Promise.all([
      prisma.salesRecord.aggregate({
        where,
        _sum: { revenue: true, units: true, cogs: true },
        _avg: { margin: true },
        _count: { id: true },
      }),
      prisma.salesRecord.aggregate({
        where: prevWhere,
        _sum: { revenue: true, units: true },
        _avg: { margin: true },
        _count: { id: true },
      }),
    ]);

    // Revenue by day (trend)
    const dailySales = await prisma.salesRecord.findMany({
      where,
      select: { date: true, revenue: true, units: true },
      orderBy: { date: "asc" },
    });

    const byDay: Record<string, { revenue: number; units: number }> = {};
    dailySales.forEach((r) => {
      const key = format(new Date(r.date), "MMM d");
      if (!byDay[key]) byDay[key] = { revenue: 0, units: 0 };
      byDay[key].revenue += r.revenue;
      byDay[key].units += r.units;
    });

    const trendData = Object.entries(byDay)
      .slice(-30)
      .map(([date, v]) => ({ date, revenue: Math.round(v.revenue), units: v.units }));

    // Revenue by channel
    const byChannel = await prisma.salesRecord.groupBy({
      by: ["channel"],
      where,
      _sum: { revenue: true },
      orderBy: { _sum: { revenue: "desc" } },
    });

    // Revenue by product category
    const byCategory = await prisma.salesRecord.groupBy({
      by: ["category"],
      where,
      _sum: { revenue: true, units: true },
      _avg: { margin: true },
      orderBy: { _sum: { revenue: "desc" } },
    });

    // Top sales reps
    const bySalesRep = await prisma.salesRecord.groupBy({
      by: ["salesRep"],
      where: { ...where, salesRep: { not: null } },
      _sum: { revenue: true, units: true },
      _count: { id: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: 10,
    });

    // Paginated sales table
    const [tableData, total] = await Promise.all([
      prisma.salesRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salesRecord.count({ where }),
    ]);

    const rev = current._sum.revenue || 0;
    const prevRev = previous._sum.revenue || 0;
    const units = current._sum.units || 0;
    const prevUnits = previous._sum.units || 0;
    const margin = current._avg.margin || 0;
    const prevMargin = previous._avg.margin || 0;
    const deals = current._count.id;
    const prevDeals = previous._count.id;

    function pctChange(cur: number, prev: number) {
      if (!prev) return 0;
      return Math.round(((cur - prev) / prev) * 1000) / 10;
    }

    return NextResponse.json({
      kpis: {
        revenue: { label: "Total Revenue", value: Math.round(rev), changePercent: pctChange(rev, prevRev), trend: rev >= prevRev ? "up" : "down", format: "currency" },
        units: { label: "Units Sold", value: units, changePercent: pctChange(units, prevUnits), trend: units >= prevUnits ? "up" : "down", format: "number" },
        avgMargin: { label: "Avg. Margin", value: Math.round(margin * 10) / 10, changePercent: pctChange(margin, prevMargin), trend: margin >= prevMargin ? "up" : "down", format: "percent" },
        deals: { label: "Total Deals", value: deals, changePercent: pctChange(deals, prevDeals), trend: deals >= prevDeals ? "up" : "down", format: "number" },
      },
      trendData,
      byChannel: byChannel.map((c) => ({ channel: c.channel, revenue: Math.round(c._sum.revenue || 0) })),
      byCategory: byCategory.map((c) => ({ category: c.category, revenue: Math.round(c._sum.revenue || 0), units: c._sum.units || 0, margin: Math.round((c._avg.margin || 0) * 10) / 10 })),
      bySalesRep: bySalesRep.map((r) => ({ rep: r.salesRep || "Unassigned", revenue: Math.round(r._sum.revenue || 0), units: r._sum.units || 0, deals: r._count.id })),
      table: { items: tableData, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error("[SALES_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
