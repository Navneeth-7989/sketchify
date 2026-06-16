"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";

export function AuthButtons() {
  const router = useRouter();

  return (
    <div className="flex gap-3">
      <Button onClick={() => router.push("/signup")}>Sign up</Button>
      <Button variant="secondary" onClick={() => router.push("/signin")}>
        Sign in
      </Button>
    </div>
  );
}
