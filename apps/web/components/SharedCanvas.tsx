"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { SceneData } from "@/lib/scene";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <span className="text-sm font-medium text-gray-400">Loading…</span>
        </div>
      </div>
    ),
  }
);

export function SharedCanvas({ scene }: { scene: SceneData }) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    if (!api) return;
    api.scrollToContent(scene.elements, { fitToContent: true });
  }, [api, scene.elements]);

  return (
    <div className="fixed inset-0 h-screen w-screen">
      <div className="pointer-events-none fixed left-4 top-4 z-[100] flex items-center gap-2">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-500 active:scale-95"
        >
          Sketchify
        </Link>
        <span className="pointer-events-auto rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-xs font-medium text-gray-300 shadow-lg shadow-black/20 backdrop-blur-md">
          Shared view · read-only
        </span>
      </div>
      <Excalidraw
        excalidrawAPI={setApi}
        viewModeEnabled
        initialData={{
          elements: scene.elements,
          appState: { ...scene.appState, theme: scene.appState.theme ?? "dark" },
          files: scene.files,
          scrollToContent: true,
        }}
      />
    </div>
  );
}
