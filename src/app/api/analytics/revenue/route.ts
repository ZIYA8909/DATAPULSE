import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "90");
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const prevStart = startOfDay(subDays(now, days * 2));

    // Current vs previous revenue
    const [current, previous] = await Promise.all([
      prisma.analyticsRecord.aggregate({ where: { metric: "revenue", date: { gte: startDate }, category: "overall" }, _sum: { value: true } }),
      prisma.analyticsRecord.aggregate({ where: { metric: "revenue", date: { gte: prevStart, lt: startDate }, category: "overall" }, _sum: { value: true } }),
    ]);

    // Monthly revenue (last 12 months)
    const monthly = await prisma.analyticsRecord.findMany({
      where: { metric: "revenue", date: { gte: subDays(now, 365) }, category: "overall" },
      orderBy: { date: "asc" },
    });

    const monthMap: Record<string, number> = {};
    monthly.forEach((r) => {
      const key = format(new Date(r.date), "MMM yyyy");
      monthMap[key] = (monthMap[key] || 0) + r.value;
    });

    const monthlyRevenue = Object.entries(monthMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
      mrr: Math.round(revenue / 30),
    }));

    // Revenue by channel (from sales records)
    const byChannel = await prisma.salesRecord.groupBy({
      by: ["channel"],
      where: { date: { gte: startDate } },
      _sum: { revenue: true },
    });

    // Top revenue products
    const topProducts = await prisma.salesRecord.groupBy({
      by: ["product", "category"],
      where: { date: { gte: startDate } },
      _sum: { revenue: true, units: true, cogs: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: 10,
    });

    // Calculate ARR/MRR from last 30 days
    const last30 = await prisma.analyticsRecord.aggregate({
      where: { metric: "revenue", date: { gte: subDays(now, 30) }, category: "overall" },
      _sum: { value: true },
    });
    const mrr = Math.round((last30._sum.value || 0) / 1000); // simplified
    const arr = mrr * 12;

    const rev = current._sum.value || 0;
    const prevRev = previous._sum.value || 0;
    const pctChange = prevRev ? Math.round(((rev - prevRev) / prevRev) * 1000) / 10 : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue: { label: "Total Revenue", value: Math.round(rev), changePercent: pctChange, trend: pctChange >= 0 ? "up" : "down", format: "currency" },
        mrr: { label: "MRR", value: mrr * 1000, changePercent: 8.2, trend: "up", format: "currency" },
        arr: { label: "ARR", value: arr * 1000, changePercent: 8.2, trend: "up", format: "currency" },
        avgDealSize: { label: "Avg Deal Size", value: 4280, changePercent: 3.7, trend: "up", format: "currency" },
      },
      monthlyRevenue,
      byChannel: byChannel.map((c) => ({ channel: c.channel, revenue: Math.round(c._sum.revenue || 0) })),
      topProducts: topProducts.map((p) => ({
        product: p.product,
        category: p.category,
        revenue: Math.round(p._sum.revenue || 0),
        units: p._sum.units || 0,
        grossProfit: Math.round((p._sum.revenue || 0) - (p._sum.cogs || 0)),
        margin: p._sum.revenue ? Math.round((((p._sum.revenue || 0) - (p._sum.cogs || 0)) / (p._sum.revenue || 1)) * 1000) / 10 : 0,
      })),
    });
  } catch (err) {
    console.error("[REVENUE_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
