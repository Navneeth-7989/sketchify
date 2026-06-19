import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, Prisma } from "db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drawing = await prisma.drawing.findUnique({ where: { userId } });
  if (!drawing) {
    return NextResponse.json({ scene: null });
  }

  return NextResponse.json({
    scene: {
      elements: drawing.elements,
      appState: drawing.appState,
      files: drawing.files,
    },
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  await prisma.drawing.upsert({
    where: { userId },
    create: { userId, elements, appState, files },
    update: { elements, appState, files },
  });

  return NextResponse.json({ ok: true });
}
