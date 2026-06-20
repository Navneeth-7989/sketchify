"use client";

import { useState } from "react";

export function InviteDialog({
  link,
  onClose,
}: {
  link: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
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
          <InviteArt />

          <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white">
            Invite your team
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-gray-400">
            Share this link to collaborate with others — anyone who signs in can
            join your room and draw with you live.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-950/50 p-1.5 ring-1 ring-inset ring-white/5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-indigo-300">
              <LinkIcon />
            </span>
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-gray-300 outline-none"
            />
            <button
              onClick={copyLink}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-95"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stylised hero: a link/share badge fanning out to collaborators. */
function InviteArt() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/40 ring-1 ring-inset ring-white/5">
      <svg
        viewBox="0 0 480 200"
        className="h-auto w-full"
        role="img"
        aria-label="A shared link connecting several collaborators"
      >
        <defs>
          <linearGradient id="iv-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b1b22" />
            <stop offset="1" stopColor="#121217" />
          </linearGradient>
          <linearGradient id="iv-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="480" height="200" fill="url(#iv-bg)" />

        {/* faint grid */}
        <g stroke="#ffffff" strokeOpacity="0.04">
          {[60, 120, 180, 240, 300, 360, 420].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" />
          ))}
          {[50, 100, 150].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} />
          ))}
        </g>

        {/* connector lines from hub to each peer */}
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round">
          <line x1="240" y1="100" x2="110" y2="56" />
          <line x1="240" y1="100" x2="96" y2="146" />
          <line x1="240" y1="100" x2="384" y2="62" />
          <line x1="240" y1="100" x2="372" y2="150" />
        </g>

        {/* peers */}
        <Peer cx={110} cy={56} color="#ec4899" label="A" />
        <Peer cx={96} cy={146} color="#22d3ee" label="S" />
        <Peer cx={384} cy={62} color="#f59e0b" label="M" />
        <Peer cx={372} cy={150} color="#34d399" label="K" />

        {/* central link hub */}
        <circle cx="240" cy="100" r="34" fill="url(#iv-violet)" fillOpacity="0.18" stroke="url(#iv-violet)" strokeWidth="2.5" />
        <g transform="translate(240 100)" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M-3 4 a7 7 0 0 0 10 0 l5 -5 a7 7 0 0 0 -10 -10 l-2.5 2.5" />
          <path d="M3 -4 a7 7 0 0 0 -10 0 l-5 5 a7 7 0 0 0 10 10 l2.5 -2.5" />
        </g>
      </svg>
    </div>
  );
}

function Peer({
  cx,
  cy,
  color,
  label,
}: {
  cx: number;
  cy: number;
  color: string;
  label: string;
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="17" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2" />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill={color}
      >
        {label}
      </text>
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

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
