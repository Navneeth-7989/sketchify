"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import type { WorkspaceUser } from "./Topbar";

export function ProfileMenu({ user }: { user: WorkspaceUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full p-[2px] shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-indigo-500/60 active:scale-95"
        title={user.name ?? user.email ?? "Account"}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 via-indigo-500 to-fuchsia-500 opacity-90 transition-opacity duration-200 group-hover:opacity-100" />
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gray-900 text-sm font-semibold text-white ring-1 ring-black/20">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="bg-gradient-to-br from-violet-300 to-indigo-200 bg-clip-text text-transparent">
              {initial}
            </span>
          )}
        </span>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-900 bg-emerald-400" />
      </button>

      <div
        className={`absolute right-0 top-12 w-60 origin-top-right rounded-2xl border border-white/10 bg-gray-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white ring-1 ring-white/10">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.name ?? "User"}
            </p>
            {user.email && (
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            )}
          </div>
        </div>

        <div className="my-1 h-px bg-white/10" />

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/10"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
