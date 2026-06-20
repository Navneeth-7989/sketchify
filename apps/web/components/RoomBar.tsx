"use client";

import { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ClientMessage, PublicParticipant } from "@/lib/collabTypes";
import type { SceneData } from "@/lib/scene";
import { offsetAppendElements } from "@/lib/appendScene";
import { bumpRev } from "@/lib/drawingRev";

export function RoomBar({
  roomId,
  participants,
  you,
  canDraw,
  connecting,
  api,
  send,
}: {
  roomId: string;
  participants: PublicParticipant[];
  you: PublicParticipant | null;
  canDraw: boolean;
  connecting: boolean;
  api: ExcalidrawImperativeAPI | null;
  send: (message: ClientMessage) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  async function copyLink() {
    try {
      const url = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function saveToCanvas() {
    if (!api) return;
    const roomElements = api.getSceneElements();
    if (roomElements.length === 0) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2600);
      return;
    }
    setSaving(true);
    try {
      const roomFiles = api.getFiles();

      let existing: SceneData = { elements: [], appState: {}, files: {} };
      const res = await fetch("/api/drawing", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { scene: SceneData | null };
        if (data.scene) existing = data.scene;
      }

      const merged = offsetAppendElements(
        existing.elements as ExcalidrawElement[],
        roomElements
      );

      const put = await fetch("/api/drawing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elements: merged,
          appState: existing.appState ?? {},
          files: { ...(existing.files ?? {}), ...roomFiles },
        }),
      });

      if (!put.ok) {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2600);
        return;
      }

      bumpRev();
      try {
        sessionStorage.setItem("sketchify:fitOnLoad", "1");
      } catch {
        void 0;
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2600);
    } finally {
      setSaving(false);
    }
  }

  async function endRoom() {
    await fetch(`/api/rooms/${roomId}`, { method: "DELETE" }).catch(() => {});
    send({ type: "end-room" });
  }

  return (
    <>
      <div className="pointer-events-none fixed left-16 top-3 z-[150] sm:left-20">
        <div className="pointer-events-auto relative">
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-950/70 px-2.5 py-1.5 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5 backdrop-blur-2xl transition-colors hover:bg-gray-900/80"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {connecting ? (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
            ) : (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </>
            )}
          </span>
          <span className="hidden text-xs font-medium text-gray-200 sm:inline">
            {connecting ? "Connecting…" : "Live"}
          </span>
          <span className="mx-0.5 hidden h-4 w-px bg-white/10 sm:inline-block" />
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((p) => (
              <span
                key={p.userId}
                title={p.name}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-950 text-[10px] font-semibold text-white"
                style={{ backgroundColor: p.color }}
              >
                {initials(p.name)}
              </span>
            ))}
            {participants.length > 5 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-950 bg-gray-700 text-[10px] font-semibold text-white">
                +{participants.length - 5}
              </span>
            )}
          </div>
          <ChevronIcon open={panelOpen} />
        </button>

        {panelOpen && (
          <div className="absolute left-0 top-full mt-2 w-72 animate-dialog-in rounded-2xl border border-white/10 bg-gray-950/95 p-2 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5 backdrop-blur-2xl">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              In this room · {participants.length}
            </p>
            <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
              {participants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">
                      {p.name}
                      {you && p.userId === you.userId && (
                        <span className="text-gray-500"> (you)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {p.isHost ? "Host" : p.canDraw ? "Can draw" : "View only"}
                    </p>
                  </div>

                  {you?.isHost && !p.isHost && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() =>
                          send({
                            type: "set-permission",
                            targetUserId: p.userId,
                            canDraw: !p.canDraw,
                          })
                        }
                        title={p.canDraw ? "Set to view only" : "Allow drawing"}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                          p.canDraw
                            ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                            : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                        }`}
                      >
                        {p.canDraw ? "Drawing" : "Viewer"}
                      </button>
                      <button
                        onClick={() =>
                          send({ type: "kick", targetUserId: p.userId })
                        }
                        title="Remove from room"
                        className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      >
                        <RemoveIcon />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {you?.isHost && (
              <>
                <div className="my-1 h-px bg-white/10" />
                <button
                  onClick={endRoom}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <PowerIcon />
                  End room for everyone
                </button>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="pointer-events-none fixed right-3 top-3 z-[150] sm:right-4">
        <div className="pointer-events-auto flex items-center gap-1.5">
        {you && !canDraw && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-xs font-medium text-amber-300">
            View only
          </span>
        )}
        <button
          onClick={saveToCanvas}
          disabled={saving || !api}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-xs font-medium text-gray-100 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:border-emerald-400/40 hover:bg-gray-800/90 hover:text-emerald-300 active:scale-95 disabled:opacity-50 sm:text-sm"
          title="Save this drawing to your own canvas"
        >
          <SaveIcon />
          <span className="hidden sm:inline">
            {saving
              ? "Saving…"
              : saveState === "saved"
                ? "Saved!"
                : saveState === "error"
                  ? "Failed"
                  : "Save"}
          </span>
        </button>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-95 sm:text-sm"
        >
          <LinkIcon />
          <span className="hidden sm:inline">
            {copied ? "Link copied!" : "Invite"}
          </span>
        </button>
        <button
          onClick={() => window.location.assign("/")}
          className="rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-xs font-medium text-gray-200 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-gray-800/90 active:scale-95 sm:text-sm"
        >
          Leave
        </button>
        </div>
      </div>
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
