import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));
    const prevStart = startOfDay(subDays(now, days * 2));

    const [current, previous] = await Promise.all([
      prisma.salesRecord.groupBy({
        by: ["region"],
        where: { date: { gte: startDate } },
        _sum: { revenue: true, units: true },
        _avg: { margin: true },
        _count: { id: true },
        orderBy: { _sum: { revenue: "desc" } },
      }),
      prisma.salesRecord.groupBy({
        by: ["region"],
        where: { date: { gte: prevStart, lt: startDate } },
        _sum: { revenue: true },
        orderBy: { _sum: { revenue: "desc" } },
      }),
    ]);

    const prevMap = Object.fromEntries(previous.map((p) => [p.region, p._sum.revenue || 0]));

    const regions = current.map((r) => {
      const rev = r._sum.revenue || 0;
      const prevRev = prevMap[r.region] || 0;
      const growth = prevRev ? ((rev - prevRev) / prevRev) * 100 : 0;
      return {
        region: r.region,
        revenue: Math.round(rev),
        units: r._sum.units || 0,
        deals: r._count.id,
        avgMargin: Math.round((r._avg.margin || 0) * 10) / 10,
        growth: Math.round(growth * 10) / 10,
      };
    });

    // Country breakdown
    const byCountry = await prisma.salesRecord.groupBy({
      by: ["country", "region"],
      where: { date: { gte: startDate } },
      _sum: { revenue: true, units: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: 20,
    });

    // Revenue by channel per region
    const byChannelRegion = await prisma.salesRecord.groupBy({
      by: ["region", "channel"],
      where: { date: { gte: startDate } },
      _sum: { revenue: true },
      orderBy: { _sum: { revenue: "desc" } },
    });

    const totalRevenue = regions.reduce((s, r) => s + r.revenue, 0);

    return NextResponse.json({
      kpis: {
        totalRevenue: { label: "Global Revenue", value: totalRevenue, changePercent: 9.4, trend: "up", format: "currency" },
        regions: { label: "Active Regions", value: regions.length, changePercent: 0, trend: "neutral", format: "number" },
        topRegionRevenue: { label: "Top Region Revenue", value: regions[0]?.revenue || 0, changePercent: regions[0]?.growth || 0, trend: (regions[0]?.growth || 0) >= 0 ? "up" : "down", format: "currency" },
        avgDealValue: { label: "Avg Deal Value", value: regions.reduce((s, r) => s + r.revenue, 0) / Math.max(regions.reduce((s, r) => s + r.deals, 0), 1), changePercent: 4.2, trend: "up", format: "currency" },
      },
      regions,
      byCountry: byCountry.map((c) => ({ country: c.country, region: c.region, revenue: Math.round(c._sum.revenue || 0), units: c._sum.units || 0 })),
      byChannelRegion: byChannelRegion.map((c) => ({ region: c.region, channel: c.channel, revenue: Math.round(c._sum.revenue || 0) })),
    });
  } catch (err) {
    console.error("[REGIONAL_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
