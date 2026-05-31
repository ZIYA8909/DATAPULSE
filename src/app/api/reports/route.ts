import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { createdBy: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error("[REPORTS_GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const userId = (session.user as any).id;
    const { name, description, type, config, isScheduled, scheduleFreq } = parsed.data;

    const report = await prisma.report.create({
      data: {
        name, description, type, isScheduled: isScheduled ?? false, scheduleFreq,
        config: config as import("@prisma/client").Prisma.InputJsonValue,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "report",
        entityId: report.id,
        entityName: report.name,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("[REPORTS_POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
