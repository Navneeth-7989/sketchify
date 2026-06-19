"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { Topbar, type WorkspaceUser } from "./Topbar";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-sm font-medium text-gray-400">
            Loading canvas…
          </span>
        </div>
      </div>
    ),
  }
);

export function Workspace({ user }: { user: WorkspaceUser | null }) {
  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Topbar user={user} />
      <Excalidraw initialData={{ appState: { theme: "dark" } }} />
    </div>
  );
}
