import NextAuth, { CredentialsSignin, type NextAuthResult } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "db/client";

class UserNotFoundError extends CredentialsSignin {
  code = "user_not_found";
}
class InvalidPasswordError extends CredentialsSignin {
  code = "invalid_password";
}
class UseOAuthError extends CredentialsSignin {
  code = "use_oauth";
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) throw new UserNotFoundError();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new UserNotFoundError();
        if (!user.password) throw new UseOAuthError();
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new InvalidPasswordError();

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = nextAuth.handlers;
export const auth: NextAuthResult["auth"] = nextAuth.auth;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut;