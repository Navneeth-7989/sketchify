"use client";

import { signIn } from "next-auth/react";
import { GoogleIcon, GitHubIcon } from "./ProviderIcons";
import { getSafeCallbackUrl } from "@/lib/callbackUrl";

export function OAuthButtons() {
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-gray-600">
        <span className="h-px flex-1 bg-white/10" /> or{" "}
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => signIn("google", { callbackUrl: getSafeCallbackUrl() })}
          className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-gray-200 shadow-sm transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-black/40 active:scale-[0.98]"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: getSafeCallbackUrl() })}
          className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-gray-200 shadow-sm transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-black/40 active:scale-[0.98]"
        >
          <GitHubIcon />
          Continue with GitHub
        </button>
      </div>
    </>
  );
}
