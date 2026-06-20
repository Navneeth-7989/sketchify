"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFileData,
  BinaryFiles,
  Collaborator,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  SocketId,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { serializeScene, type SceneData } from "@/lib/scene";
import type { PublicParticipant, ServerMessage } from "@/lib/collabTypes";
import { RoomBar } from "./RoomBar";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#121212]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    ),
  }
);

const SCENE_THROTTLE_MS = 80;
const CURSOR_THROTTLE_MS = 50;
const HOST_SAVE_DEBOUNCE_MS = 1200;

export function CollabWorkspace({
  roomId,
  initialScene,
}: {
  roomId: string;
  initialScene: SceneData;
}) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "kicked" | "ended" | "error"
  >("connecting");
  const [canDraw, setCanDraw] = useState(true);
  const [participants, setParticipants] = useState<PublicParticipant[]>([]);
  const [you, setYou] = useState<PublicParticipant | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const applyingRemoteRef = useRef(false);
  const canDrawRef = useRef(true);
  const collaboratorsRef = useRef<Map<string, Collaborator>>(new Map());

  const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scenePendingRef = useRef<{
    elements: readonly ExcalidrawElement[];
    files: BinaryFiles;
  } | null>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorPendingRef = useRef<{ x: number; y: number } | null>(null);
  const hostSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialData = useMemo<ExcalidrawInitialDataState>(
    () => ({
      elements: initialScene.elements as ExcalidrawElement[],
      appState: { theme: "dark", ...initialScene.appState },
      files: initialScene.files as BinaryFiles,
    }),
    [initialScene]
  );

  const send = useCallback((message: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  const withRemote = useCallback((fn: () => void) => {
    applyingRemoteRef.current = true;
    fn();
    setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 0);
  }, []);

  const applyRemoteScene = useCallback(
    (elements: unknown[], files: Record<string, unknown>) => {
      if (!api) return;
      withRemote(() => {
        api.updateScene({
          elements: elements as unknown as ExcalidrawElement[],
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        const fileList = Object.values(files ?? {});
        if (fileList.length > 0) {
          api.addFiles(fileList as unknown as BinaryFileData[]);
        }
      });
    },
    [api, withRemote]
  );

  const pushCollaborators = useCallback(() => {
    if (!api) return;
    withRemote(() => {
      api.updateScene({
        collaborators: collaboratorsRef.current as Map<SocketId, Collaborator>,
      });
    });
  }, [api, withRemote]);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;

    async function connect() {
      let token: string;
      try {
        const res = await fetch(
          `/api/collab/token?roomId=${encodeURIComponent(roomId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setStatus("error");
          return;
        }
        token = ((await res.json()) as { token: string }).token;
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }
      if (cancelled) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        send({
          type: "join",
          token,
          initialScene: {
            elements: initialScene.elements,
            files: initialScene.files,
          },
        });
      };

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data as string) as ServerMessage;
        } catch {
          return;
        }
        handleMessage(msg);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus((s) =>
          s === "kicked" || s === "ended" ? s : "error"
        );
      };
    }

    function handleMessage(msg: ServerMessage) {
      if (msg.type === "init") {
        setYou(msg.you);
        setParticipants(msg.participants);
        canDrawRef.current = msg.you.canDraw;
        setCanDraw(msg.you.canDraw);
        applyRemoteScene(msg.scene.elements, msg.scene.files);
        readyRef.current = true;
        setStatus("connected");
        return;
      }
      if (msg.type === "participants") {
        setParticipants(msg.participants);
        const ids = new Set(msg.participants.map((p) => p.userId));
        for (const key of collaboratorsRef.current.keys()) {
          if (!ids.has(key)) collaboratorsRef.current.delete(key);
        }
        pushCollaborators();
        return;
      }
      if (msg.type === "scene-update") {
        applyRemoteScene(msg.elements, msg.files);
        return;
      }
      if (msg.type === "cursor") {
        collaboratorsRef.current.set(msg.userId, {
          username: msg.name,
          color: { background: msg.color, stroke: msg.color },
          pointer: { x: msg.x, y: msg.y, tool: "pointer" },
        });
        pushCollaborators();
        return;
      }
      if (msg.type === "permission") {
        canDrawRef.current = msg.canDraw;
        setCanDraw(msg.canDraw);
        return;
      }
      if (msg.type === "kicked") {
        setStatus("kicked");
        wsRef.current?.close();
        return;
      }
      if (msg.type === "room-ended") {
        setStatus("ended");
        wsRef.current?.close();
        return;
      }
      if (msg.type === "error") {
        setStatus("error");
      }
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      readyRef.current = false;
    };
  }, [api, roomId, initialScene, send, applyRemoteScene, pushCollaborators]);

  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      if (!readyRef.current || applyingRemoteRef.current) return;
      if (!canDrawRef.current) return;

      scenePendingRef.current = { elements, files };
      if (!sceneTimerRef.current) {
        sceneTimerRef.current = setTimeout(() => {
          sceneTimerRef.current = null;
          const pending = scenePendingRef.current;
          if (!pending) return;
          send({
            type: "scene-update",
            elements: pending.elements,
            files: pending.files,
          });
        }, SCENE_THROTTLE_MS);
      }

      if (you?.isHost) {
        if (hostSaveTimerRef.current) clearTimeout(hostSaveTimerRef.current);
        hostSaveTimerRef.current = setTimeout(() => {
          const scene = serializeScene(elements, appState, files);
          void fetch(`/api/rooms/${roomId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scene),
          });
        }, HOST_SAVE_DEBOUNCE_MS);
      }
    },
    [send, you, roomId]
  );

  const handlePointer = useCallback(
    (payload: { pointer: { x: number; y: number } }) => {
      if (!readyRef.current) return;
      cursorPendingRef.current = { x: payload.pointer.x, y: payload.pointer.y };
      if (!cursorTimerRef.current) {
        cursorTimerRef.current = setTimeout(() => {
          cursorTimerRef.current = null;
          const p = cursorPendingRef.current;
          if (p) send({ type: "cursor", x: p.x, y: p.y });
        }, CURSOR_THROTTLE_MS);
      }
    },
    [send]
  );

  if (status === "kicked" || status === "ended") {
    return (
      <ExitScreen
        title={status === "kicked" ? "Removed from room" : "Room ended"}
        subtitle={
          status === "kicked"
            ? "The host removed you from this collaboration."
            : "The host ended this collaboration session."
        }
      />
    );
  }

  if (status === "error") {
    return (
      <ExitScreen
        title="Can't join this room"
        subtitle="The room may have ended, or the link is invalid."
      />
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen">
      <RoomBar
        roomId={roomId}
        participants={participants}
        you={you}
        canDraw={canDraw}
        connecting={status === "connecting"}
        api={api}
        send={send}
      />
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={handleChange}
        onPointerUpdate={handlePointer}
        isCollaborating
        viewModeEnabled={!canDraw}
      />
    </div>
  );
}

function ExitScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-[#121212] px-6 text-center">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <p className="max-w-sm text-sm text-gray-400">{subtitle}</p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-95"
      >
        Back to your canvas
      </Link>
    </div>
  );
}
