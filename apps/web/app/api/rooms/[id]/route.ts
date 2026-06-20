import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, Prisma } from "db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || !room.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    room: {
      id: room.id,
      isHost: room.hostId === userId,
      elements: room.elements,
      appState: room.appState,
      files: room.files,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || !room.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (room.hostId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    elements?: Prisma.InputJsonValue;
    appState?: Prisma.InputJsonValue;
    files?: Prisma.InputJsonValue;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const elements = Array.isArray(body?.elements) ? body.elements : [];
  const appState = body?.appState ?? {};
  const files = body?.files ?? {};

  await prisma.room.update({
    where: { id },
    data: { elements, appState, files },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json({ ok: true });
  }
  if (room.hostId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.room.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
