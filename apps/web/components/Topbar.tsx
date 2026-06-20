"use client";

import { useRouter } from "next/navigation";
import { ProfileMenu } from "./ProfileMenu";

export type WorkspaceUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function Topbar({
  user,
  onShareClick,
  sharing = false,
  onCollabClick,
}: {
  user: WorkspaceUser | null;
  onShareClick?: () => void;
  sharing?: boolean;
  onCollabClick?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="pointer-events-none fixed right-2 top-2 z-[100] flex items-center gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
      {user ? (
        <>
          <ShareButton onClick={onShareClick} active={sharing} />
          <CollabButton onClick={onCollabClick} />
          <ProfileMenu user={user} />
        </>
      ) : (
        <>
          <button
            onClick={() => router.push("/signin")}
            className="pointer-events-auto rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-sm font-medium text-gray-100 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:border-white/20 hover:bg-gray-800/90 hover:shadow-xl active:scale-95 sm:px-4"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="pointer-events-auto rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-indigo-500/50 active:scale-95 sm:px-4"
          >
            Sign up
          </button>
        </>
      )}
    </div>
  );
}

function ShareButton({
  onClick,
  active,
}: {
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`pointer-events-auto flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-95 sm:px-4 ${
        active
          ? "bg-gradient-to-r from-sky-500 to-teal-500 shadow-sky-500/50 ring-2 ring-sky-300/50"
          : "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-indigo-500/40 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/50"
      }`}
      title="Share"
    >
      <ShareIcon />
      <span className="hidden sm:inline">{active ? "Selecting…" : "Share"}</span>
    </button>
  );
}

function CollabButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-gray-900/80 px-2.5 py-2 text-sm font-medium text-gray-100 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:border-indigo-400/40 hover:bg-gray-800/90 hover:text-indigo-300 hover:shadow-xl active:scale-95 sm:px-4"
      title="Collaborate"
    >
      <CollabIcon />
      <span className="hidden sm:inline">Collab</span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CollabIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
