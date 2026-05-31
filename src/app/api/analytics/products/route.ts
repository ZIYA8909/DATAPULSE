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

    const [current, prev] = await Promise.all([
      prisma.salesRecord.groupBy({
        by: ["product", "sku", "category"],
        where: { date: { gte: startDate } },
        _sum: { revenue: true, units: true, cogs: true },
        _avg: { margin: true },
        orderBy: { _sum: { revenue: "desc" } },
      }),
      prisma.salesRecord.groupBy({
        by: ["product"],
        where: { date: { gte: prevStart, lt: startDate } },
        _sum: { revenue: true, units: true },
        orderBy: { _sum: { revenue: "desc" } },
      }),
    ]);

    const prevMap = Object.fromEntries(prev.map((p) => [p.product, p._sum.revenue || 0]));

    const products = current.map((p) => {
      const rev = p._sum.revenue || 0;
      const prevRev = prevMap[p.product] || 0;
      const cogs = p._sum.cogs || 0;
      const grossProfit = rev - cogs;
      const marginPct = rev ? (grossProfit / rev) * 100 : 0;
      const growth = prevRev ? ((rev - prevRev) / prevRev) * 100 : 0;
      return {
        product: p.product,
        sku: p.sku,
        category: p.category,
        revenue: Math.round(rev),
        units: p._sum.units || 0,
        grossProfit: Math.round(grossProfit),
        margin: Math.round(marginPct * 10) / 10,
        growth: Math.round(growth * 10) / 10,
        avgPrice: p._sum.units ? Math.round(rev / (p._sum.units || 1)) : 0,
      };
    });

    // Category summary
    const byCategory = await prisma.salesRecord.groupBy({
      by: ["category"],
      where: { date: { gte: startDate } },
      _sum: { revenue: true, units: true },
      orderBy: { _sum: { revenue: "desc" } },
    });

    const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
    const totalUnits = products.reduce((s, p) => s + p.units, 0);
    const avgMargin = products.reduce((s, p) => s + p.margin, 0) / (products.length || 1);
    const topGrowing = [...products].sort((a, b) => b.growth - a.growth)[0];

    return NextResponse.json({
      kpis: {
        totalRevenue: { label: "Product Revenue", value: totalRevenue, changePercent: 7.3, trend: "up", format: "currency" },
        totalUnits: { label: "Units Sold", value: totalUnits, changePercent: 5.8, trend: "up", format: "number" },
        avgMargin: { label: "Avg. Gross Margin", value: Math.round(avgMargin * 10) / 10, changePercent: 1.2, trend: "up", format: "percent" },
        skuCount: { label: "Active SKUs", value: products.length, changePercent: 0, trend: "neutral", format: "number" },
      },
      products,
      byCategory: byCategory.map((c) => ({ category: c.category, revenue: Math.round(c._sum.revenue || 0), units: c._sum.units || 0 })),
    });
  } catch (err) {
    console.error("[PRODUCTS_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
