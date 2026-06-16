"use client";

import { signOut } from "next-auth/react";
import { Button } from "@repo/ui/button";

export function LogoutButton() {
  return (
    <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
      Log out
    </Button>
  );
}
