import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "db/client";
import { CollabWorkspace } from "@/components/CollabWorkspace";
import type { SceneData } from "@/lib/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/room/${id}`)}`);
  }

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    notFound();
  }
  if (!room.isActive) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-[#121212] px-6 text-center">
        <h1 className="text-xl font-semibold text-white">Room ended</h1>
        <p className="max-w-sm text-sm text-gray-400">
          This collaboration session has been closed by the host.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-95"
        >
          Back to your canvas
        </Link>
      </div>
    );
  }

  const initialScene = {
    elements: room.elements,
    appState: room.appState,
    files: room.files,
  } as unknown as SceneData;

  return <CollabWorkspace roomId={id} initialScene={initialScene} />;
}
