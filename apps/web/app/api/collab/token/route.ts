import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "db/client";
import { signCollabToken } from "@/lib/collabToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || !room.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = signCollabToken({
    userId,
    name: session.user?.name ?? "Anonymous",
    image: session.user?.image ?? null,
    roomId,
    host: room.hostId === userId,
  });

  return NextResponse.json({ token });
}
