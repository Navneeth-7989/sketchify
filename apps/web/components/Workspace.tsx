"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { Topbar, type WorkspaceUser } from "./Topbar";
import { ShareDialog } from "./ShareDialog";
import { CollabDialog } from "./CollabDialog";
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

function pickSelectedScene(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles
): SceneData | null {
  const selectedIds = appState.selectedElementIds ?? {};
  const idSet = new Set(
    Object.keys(selectedIds).filter((id) => selectedIds[id])
  );
  if (idSet.size === 0) return null;

  const elements_ = elements.filter((el) => {
    if (el.isDeleted) return false;
    if (idSet.has(el.id)) return true;
    const containerId = (el as { containerId?: string | null }).containerId;
    return containerId != null && idSet.has(containerId);
  });
  if (elements_.length === 0) return null;

  return {
    elements: elements_,
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor,
      theme: appState.theme,
    },
    files: files ?? {},
  };
}

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

  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [dialogScene, setDialogScene] = useState<SceneData | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);

  const initialData = useMemo(
    () => resolveInitialData(isAuthenticated),
    [isAuthenticated]
  );

  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = false;
    let cancelled = false;
    initialData.then(() => {
      if (!cancelled) readyRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const startShare = useCallback(() => {
    setDialogScene(null);
    if (!api) {
      setSelecting(true);
      return;
    }
    api.setActiveTool({ type: "selection" });
    const snap = pickSelectedScene(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles()
    );
    if (snap) {
      setSelecting(false);
      setDialogScene(snap);
    } else {
      setSelecting(true);
    }
  }, [api]);

  useEffect(() => {
    if (!selecting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelecting(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selecting]);

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

  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (readyRef.current) save(elements, appState, files);
      if (!selecting) return;
      const snap = pickSelectedScene(elements, appState, files);
      if (snap) {
        setSelecting(false);
        setDialogScene(snap);
      }
    },
    [save, selecting]
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
      <Topbar
        user={user}
        onShareClick={startShare}
        sharing={selecting}
        onCollabClick={() => setCollabOpen(true)}
      />

      {selecting && (
        <div className="pointer-events-none fixed left-1/2 top-2 z-[150] w-[calc(100vw-1rem)] max-w-max -translate-x-1/2 animate-dialog-in sm:top-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-gray-950/60 py-2 pl-3 pr-2 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5 backdrop-blur-2xl sm:gap-3 sm:pl-4">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
              <CursorIcon />
            </span>
            <span className="truncate text-xs font-medium text-gray-100 sm:text-sm">
              <span className="sm:hidden">Select what to share</span>
              <span className="hidden sm:inline">
                Select the elements you want to share
              </span>
            </span>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <button
              onClick={() => setSelecting(false)}
              className="ml-0.5 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:ml-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={handleChange}
      />

      {dialogScene && (
        <ShareDialog
          scene={dialogScene}
          onClose={() => setDialogScene(null)}
        />
      )}

      {collabOpen && <CollabDialog onClose={() => setCollabOpen(false)} />}
    </div>
  );
}

function CursorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}
