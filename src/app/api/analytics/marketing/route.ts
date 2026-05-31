import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { startDate: "desc" },
    });

    // Summary KPIs
    const active = campaigns.filter((c) => c.status === "active");
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const avgROAS = totalSpend ? totalRevenue / totalSpend : 0;
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const avgCTR = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;

    // By channel
    const byChannel: Record<string, { spend: number; revenue: number; conversions: number; clicks: number; impressions: number }> = {};
    campaigns.forEach((c) => {
      if (!byChannel[c.channel]) byChannel[c.channel] = { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 };
      byChannel[c.channel].spend += c.spend;
      byChannel[c.channel].revenue += c.revenue;
      byChannel[c.channel].conversions += c.conversions;
      byChannel[c.channel].clicks += c.clicks;
      byChannel[c.channel].impressions += c.impressions;
    });

    const channelData = Object.entries(byChannel).map(([channel, data]) => ({
      channel,
      spend: Math.round(data.spend),
      revenue: Math.round(data.revenue),
      conversions: data.conversions,
      roas: data.spend ? Math.round((data.revenue / data.spend) * 100) / 100 : 0,
      ctr: data.impressions ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
    }));

    return NextResponse.json({
      kpis: {
        activeCampaigns: { label: "Active Campaigns", value: active.length, changePercent: 0, trend: "neutral", format: "number" },
        totalSpend: { label: "Total Spend", value: Math.round(totalSpend), changePercent: -3.2, trend: "down", format: "currency" },
        totalRevenue: { label: "Campaign Revenue", value: Math.round(totalRevenue), changePercent: 14.8, trend: "up", format: "currency" },
        avgROAS: { label: "Avg. ROAS", value: Math.round(avgROAS * 100) / 100, changePercent: 18.9, trend: "up", format: "number" },
      },
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        budget: c.budget,
        spend: Math.round(c.spend),
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        revenue: Math.round(c.revenue),
        ctr: c.ctr,
        cpc: c.cpc,
        roas: c.roas,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      channelData,
    });
  } catch (err) {
    console.error("[MARKETING_API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
