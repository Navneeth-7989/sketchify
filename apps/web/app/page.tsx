import { auth } from "@/auth";
import { AuthButtons } from "./auth-buttons";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-4xl">Hi There</div>

      {session?.user ? (
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm text-gray-600">
            Signed in as {session.user.email}
          </span>
          <LogoutButton />
        </div>
      ) : (
        <AuthButtons />
      )}
    </div>
  );
}
