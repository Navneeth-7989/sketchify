import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "db/client";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "User already exists. Please log in." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashed } });

  return NextResponse.json({ ok: true }, { status: 201 });
}