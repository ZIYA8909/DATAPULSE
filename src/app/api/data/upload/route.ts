import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string || "Untitled Dataset";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const rows = lines.length - 1; // exclude header
    const headers = lines[0]?.split(",").map((h) => h.trim().replace(/"/g, "")) || [];

    const columns = headers.map((h) => ({
      name: h,
      type: "string" as const, // simplified type inference
    }));

    const preview = lines.slice(1, 11).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
    });

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

    const dataset = await prisma.dataset.create({
      data: {
        name,
        filename,
        originalName: file.name,
        mimeType: file.type || "text/csv",
        size: file.size,
        rows,
        columns,
        preview,
        status: "READY",
        uploadedById: (session.user as any).id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "IMPORT",
        entity: "dataset",
        entityId: dataset.id,
        entityName: file.name,
        metadata: { rows, columns: headers.length },
      },
    });

    return NextResponse.json({ success: true, dataset }, { status: 201 });
  } catch (err) {
    console.error("[UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const datasets = await prisma.dataset.findMany({
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ datasets });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
