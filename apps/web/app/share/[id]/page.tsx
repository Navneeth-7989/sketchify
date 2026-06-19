import { notFound } from "next/navigation";
import { prisma } from "db/client";
import { SharedCanvas } from "@/components/SharedCanvas";
import type { SceneData } from "@/lib/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const share = await prisma.share.findUnique({ where: { id } });
  if (!share) {
    notFound();
  }

  const scene = {
    elements: share.elements,
    appState: share.appState,
    files: share.files,
  } as unknown as SceneData;

  return <SharedCanvas scene={scene} />;
}
