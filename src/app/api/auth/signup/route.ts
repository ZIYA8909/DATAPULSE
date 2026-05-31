import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let organizationId: string | undefined;
    if (organizationName) {
      const org = await prisma.organization.create({
        data: {
          name: organizationName,
          slug: slugify(organizationName) + "-" + Date.now().toString(36),
        },
      });
      organizationId = org.id;
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        organizationId,
      },
    });

    return NextResponse.json(
      { message: "Account created. Please verify your email." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNUP]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
