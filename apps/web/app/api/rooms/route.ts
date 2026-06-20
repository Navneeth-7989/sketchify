import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await prisma.room.create({
    data: { hostId: userId },
  });

  return NextResponse.json({ id: room.id });
}
