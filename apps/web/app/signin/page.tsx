"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    else if (res?.ok) router.push("/");
    else if (res?.error) setMsg("Sign in failed. Please try again.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="rounded border px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="rounded border px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black py-2 text-white disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

        <div className="my-4 flex items-center gap-2 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> OR{" "}
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="rounded border py-2"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="rounded border py-2"
          >
            Continue with GitHub
          </button>
        </div>

        <p className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
