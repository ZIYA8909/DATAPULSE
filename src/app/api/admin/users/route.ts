import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const search = searchParams.get("search") || undefined;

    // Only admins can list all users
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          jobTitle: true, department: true, isActive: true,
          lastLoginAt: true, createdAt: true,
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error("[ADMIN_USERS_GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, role, isActive } = body;
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const user = await prisma.user.update({
      where: { id },
      data: { ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "user",
        entityId: user.id,
        entityName: user.name,
        metadata: { changes: { role, isActive } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_USERS_PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
