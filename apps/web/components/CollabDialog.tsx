"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CollabDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      if (!res.ok) {
        setError("Could not create a room. Please try again.");
        setCreating(false);
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/room/${data.id}`);
    } catch {
      setError("Could not create a room. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-dialog-in overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-2xl shadow-black/70 ring-1 ring-inset ring-white/10 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-violet-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl"
        />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon />
        </button>

        <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8">
          <CollabArt />

          <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white">
            Collaborate in real time
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-gray-400">
            Share a link and sketch together — live cursors, instant sync, and
            you stay in control.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Chip>Live cursors</Chip>
            <Chip>Instant sync</Chip>
            <Chip>Host controls</Chip>
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={createRoom}
            disabled={creating}
            className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/60 active:scale-[0.98] disabled:opacity-60"
          >
            {creating ? (
              <>
                <Spinner />
                Creating room…
              </>
            ) : (
              <>
                <SparkleIcon />
                Create a room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
      {children}
    </span>
  );
}

/** Stylised hero: a shared canvas with two live cursors drawing together. */
function CollabArt() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/40 ring-1 ring-inset ring-white/5">
      <svg
        viewBox="0 0 480 200"
        className="h-auto w-full"
        role="img"
        aria-label="Two people sketching together on a shared canvas in real time"
      >
        <defs>
          <linearGradient id="ca-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b1b22" />
            <stop offset="1" stopColor="#121217" />
          </linearGradient>
          <linearGradient id="ca-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="480" height="200" fill="url(#ca-bg)" />

        {/* faint grid */}
        <g stroke="#ffffff" strokeOpacity="0.04">
          {[60, 120, 180, 240, 300, 360, 420].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" />
          ))}
          {[50, 100, 150].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} />
          ))}
        </g>

        {/* sketched shapes being drawn together */}
        <rect
          x="74"
          y="70"
          width="116"
          height="66"
          rx="12"
          fill="url(#ca-violet)"
          fillOpacity="0.18"
          stroke="url(#ca-violet)"
          strokeWidth="2.5"
        />
        <ellipse
          cx="338"
          cy="100"
          rx="50"
          ry="38"
          fill="#22d3ee"
          fillOpacity="0.14"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />
        <path
          d="M196 103 C 240 103, 252 100, 282 100"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        <path
          d="M280 95 l10 5 l-10 5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* live cursor — violet */}
        <Cursor x={150} y={140} color="#8b5cf6" name="You" />
        {/* live cursor — pink */}
        <Cursor x={326} y={58} color="#ec4899" name="Aria" />
      </svg>
    </div>
  );
}

function Cursor({
  x,
  y,
  color,
  name,
}: {
  x: number;
  y: number;
  color: string;
  name: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 0 L0 17 L4.6 12.6 L7.4 18.4 L9.8 17.2 L7 11.4 L13 11 Z"
        fill={color}
        stroke="#0b0b0f"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <g transform="translate(12 14)">
        <rect width={name.length * 7 + 16} height="20" rx="10" fill={color} />
        <text
          x={(name.length * 7 + 16) / 2}
          y="14"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="#ffffff"
        >
          {name}
        </text>
      </g>
    </g>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
