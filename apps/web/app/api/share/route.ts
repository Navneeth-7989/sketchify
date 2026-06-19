import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, Prisma } from "db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
  if (elements.length === 0) {
    return NextResponse.json({ error: "Nothing to share" }, { status: 400 });
  }
  const appState = body?.appState ?? {};
  const files = body?.files ?? {};

  const share = await prisma.share.create({
    data: { userId, elements, appState, files },
  });

  return NextResponse.json({ id: share.id });
}
