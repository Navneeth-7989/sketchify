"use client";

import { useState } from "react";
import type { SceneData } from "@/lib/scene";
import { exportSelectionToPng, exportSelectionToSvg } from "@/lib/exportScene";
import { createShare } from "@/lib/share";

type LinkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error" };

export function ShareDialog({
  scene,
  onClose,
}: {
  scene: SceneData;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<"png" | "svg" | null>(null);
  const [link, setLink] = useState<LinkState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const count = scene.elements.length;

  async function handlePng() {
    setBusy("png");
    try {
      await exportSelectionToPng(scene);
    } finally {
      setBusy(null);
    }
  }

  async function handleSvg() {
    setBusy("svg");
    try {
      await exportSelectionToSvg(scene);
    } finally {
      setBusy(null);
    }
  }

  async function handleLink() {
    setLink({ status: "loading" });
    const id = await createShare(scene);
    if (!id) {
      setLink({ status: "error" });
      return;
    }
    setLink({ status: "ready", url: `${window.location.origin}/share/${id}` });
  }

  async function handleCopy() {
    if (link.status !== "ready") return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-overlay-in"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gray-950/60 shadow-2xl shadow-black/80 ring-1 ring-inset ring-white/5 backdrop-blur-2xl animate-dialog-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          title="Close"
        >
          <CloseIcon />
        </button>

        <div className="relative px-5 pb-6 pt-8 sm:px-7 sm:pb-7">
          <div
            className="flex flex-col items-center text-center animate-rise"
            style={{ animationDelay: "40ms" }}
          >
            <div className="relative mb-4">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 blur-lg opacity-50" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/90 to-teal-500/90 text-white shadow-lg shadow-sky-500/30 animate-float-slow">
                <ShareIcon />
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Share your work</h2>
            <p className="mt-1.5 max-w-xs text-sm text-gray-400">
              Export your selection as an image, or generate a link anyone can
              open to view it.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {count} element{count === 1 ? "" : "s"} selected
            </span>
          </div>

          <div
            className="mt-7 grid grid-cols-2 gap-3 animate-rise"
            style={{ animationDelay: "120ms" }}
          >
            <ExportCard
              label="PNG"
              sub="High-res image"
              loading={busy === "png"}
              disabled={busy !== null}
              onClick={handlePng}
              icon={<ImageIcon />}
              accent="from-sky-500/20 to-cyan-500/10 text-sky-300"
            />
            <ExportCard
              label="SVG"
              sub="Scalable vector"
              loading={busy === "svg"}
              disabled={busy !== null}
              onClick={handleSvg}
              icon={<VectorIcon />}
              accent="from-emerald-500/20 to-teal-500/10 text-emerald-300"
            />
          </div>

          <div
            className="my-6 flex items-center gap-3 animate-rise"
            style={{ animationDelay: "200ms" }}
          >
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              or share a link
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="animate-rise" style={{ animationDelay: "280ms" }}>
            {link.status === "ready" ? (
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-gray-400">
                  Anyone with this link can view your selection — no account
                  needed.
                </p>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-950/70 p-2 pl-4">
                  <LinkIcon className="h-4 w-4 flex-shrink-0 text-sky-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                    {link.url}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      copied
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-teal-400"
                    }`}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLink}
                disabled={link.status === "loading"}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-gray-100 transition-all duration-200 hover:border-sky-400/40 hover:bg-white/[0.07] hover:text-white active:scale-[0.99] disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {link.status === "loading" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
                ) : (
                  <LinkIcon className="h-4 w-4 text-sky-300" />
                )}
                {link.status === "loading"
                  ? "Generating your link…"
                  : "Generate shareable link"}
              </button>
            )}

            {link.status === "error" && (
              <p className="mt-2.5 text-xs text-red-400">
                Couldn&apos;t create the link. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportCard({
  label,
  sub,
  icon,
  accent,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-110 ${accent}`}
      >
        {loading ? (
          <span className="block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
      </span>
      <span className="text-base font-bold text-white">{label}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VectorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
