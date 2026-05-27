import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "@formforge/db";
import db, { users } from "@formforge/db";
import { RegisterSchema } from "@formforge/schemas/user";
import { sendWelcomeEmail } from "@formforge/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const insertResult = await db
      .insert(users)
      .values({ name, email, password: hashedPassword })
      .returning();
    const user = insertResult[0];
    if (!user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
    void sendWelcomeEmail({
      to: user.email!,
      name: user.name ?? "there",
      dashboardUrl: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
