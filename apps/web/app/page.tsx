import { auth } from "@/auth";
import { Workspace } from "@/components/Workspace";

export default async function Home() {
  const session = await auth();

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

  return <Workspace user={user} />;
}
