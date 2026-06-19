"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { Topbar, type WorkspaceUser } from "./Topbar";
import { serializeScene, isSceneNonEmpty, type SceneData } from "@/lib/scene";
import {
  loadLocalScene,
  saveLocalScene,
  clearLocalScene,
} from "@/lib/localScene";
import { loadDbScene, saveDbScene } from "@/lib/dbScene";

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

const SAVE_DEBOUNCE_MS = 600;

type Debounced<A extends unknown[]> = ((...args: A) => void) & {
  flush: () => void;
};

function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;
  const debounced = (...args: A) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (lastArgs) fn(...lastArgs);
    }, wait);
  };
  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      timer = undefined;
      fn(...lastArgs);
    }
  };
  return debounced;
}

const DEFAULT_DATA: ExcalidrawInitialDataState = {
  appState: { theme: "dark" },
};

function toInitialData(scene: SceneData): ExcalidrawInitialDataState {
  return {
    elements: scene.elements,
    appState: { theme: "dark", ...scene.appState },
    files: scene.files,
  };
}

async function resolveInitialData(
  isAuthenticated: boolean
): Promise<ExcalidrawInitialDataState> {
  try {
    if (!isAuthenticated) {
      const local = loadLocalScene();
      return local ? toInitialData(local) : DEFAULT_DATA;
    }

    const dbScene = await loadDbScene();
    const localScene = loadLocalScene();

    if (isSceneNonEmpty(localScene)) {
      if (!isSceneNonEmpty(dbScene)) {
        await saveDbScene(localScene as SceneData);
        clearLocalScene();
        return toInitialData(localScene as SceneData);
      }
      clearLocalScene();
    }

    return dbScene ? toInitialData(dbScene) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

export function Workspace({ user }: { user: WorkspaceUser | null }) {
  const isAuthenticated = !!user;

  const initialData = useMemo(
    () => resolveInitialData(isAuthenticated),
    [isAuthenticated]
  );

  const save = useMemo(
    () =>
      debounce(
        (
          elements: readonly ExcalidrawElement[],
          appState: AppState,
          files: BinaryFiles
        ) => {
          const scene = serializeScene(elements, appState, files);
          if (isAuthenticated) {
            void saveDbScene(scene);
          } else {
            saveLocalScene(scene);
          }
        },
        SAVE_DEBOUNCE_MS
      ),
    [isAuthenticated]
  );

  useEffect(() => {
    const flush = () => save.flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      save.flush();
    };
  }, [save]);

  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Topbar user={user} />
      <Excalidraw initialData={initialData} onChange={save} />
    </div>
  );
}
