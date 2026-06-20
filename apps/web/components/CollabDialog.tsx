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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-dialog-in rounded-2xl border border-white/10 bg-gray-950/95 p-6 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-indigo-300">
            <UsersIcon />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Live collaboration
            </h2>
            <p className="text-xs text-gray-400">Draw together in real time</p>
          </div>
        </div>

        <ul className="mb-5 flex flex-col gap-2 text-sm text-gray-300">
          <Feature>Share a link — anyone who signs in can join your room</Feature>
          <Feature>Everyone&apos;s edits and cursors sync instantly</Feature>
          <Feature>You stay in control: mute drawing, remove people, end the room</Feature>
          <Feature>Save the result to your own canvas whenever you like</Feature>
        </ul>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={createRoom}
            disabled={creating}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create a room"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
        <CheckIcon />
      </span>
      <span>{children}</span>
    </li>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
