"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { OAuthButtons } from "@/components/OAuthButtons";
import { getSafeCallbackUrl } from "@/lib/callbackUrl";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.code === "user_not_found")
      setMsg("User doesn't exist. Please sign up first.");
    else if (res?.code === "invalid_password")
      setMsg("Incorrect password. Please try again.");
    else if (res?.code === "use_oauth")
      setMsg("This account uses Google/GitHub. Please sign in with those.");
    else if (res?.ok) router.push(getSafeCallbackUrl());
    else if (res?.error) setMsg("Sign in failed. Please try again.");
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your canvases"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-white transition-colors hover:text-sky-300 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-sky-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/15"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-sky-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/15"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-gradient-to-b from-white to-gray-200 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-black/40 transition-all duration-200 hover:to-white hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {msg && (
        <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {msg}
        </p>
      )}

      <OAuthButtons />
    </AuthLayout>
  );
}
