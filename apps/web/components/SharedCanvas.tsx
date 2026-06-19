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
      <div className="pointer-events-none fixed left-2 top-2 z-[100] flex items-center gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-white to-gray-300 px-3 py-2 text-sm font-bold text-gray-900 shadow-lg shadow-black/40 transition-all duration-200 hover:scale-[1.03] active:scale-95 sm:px-3.5"
        >
          <span className="text-base leading-none">✏️</span>
          Sketchify
        </Link>
        <span className="pointer-events-auto rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-xs font-medium text-gray-300 shadow-lg shadow-black/20 backdrop-blur-md">
          <span className="sm:hidden">Read-only</span>
          <span className="hidden sm:inline">Shared view · read-only</span>
        </span>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-3 z-[100] flex justify-center px-3 animate-slide-up sm:bottom-5"
        style={{ animationDelay: "400ms" }}
      >
        <div className="pointer-events-auto relative flex w-full max-w-xl items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gray-950/70 p-3 shadow-2xl shadow-black/70 ring-1 ring-inset ring-white/5 backdrop-blur-2xl sm:gap-5 sm:p-4 sm:pl-5">
          <div className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <span className="relative hidden h-12 w-12 flex-shrink-0 animate-float-slow items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-300 text-2xl shadow-lg shadow-black/40 sm:flex">
            ✏️
          </span>

          <div className="relative min-w-0 flex-1">
            <p className="text-sm font-bold text-white sm:text-base">
              Like what you see?
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">
              Bring your own ideas to life — start sketching free on Sketchify.
            </p>
          </div>

          <Link
            href="/"
            className="group relative flex flex-shrink-0 items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-b from-white to-gray-200 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-lg shadow-black/40 transition-all duration-200 hover:to-white hover:shadow-xl active:scale-95 sm:px-5"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="hidden sm:inline">Create your own</span>
            <span className="sm:hidden">Create</span>
            <ArrowIcon />
          </Link>
        </div>
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

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
