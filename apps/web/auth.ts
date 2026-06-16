import NextAuth, { CredentialsSignin, type NextAuthResult } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "db/client";

// Custom errors so the login page can show specific messages
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
  session: { strategy: "jwt" }, // REQUIRED because you use Credentials
  pages: {
    signIn: "/", // canvas is the landing page; modal handles UI
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

        if (!user) throw new UserNotFoundError();        // "signup first"
        if (!user.password) throw new UseOAuthError();   // OAuth-only user
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

// Explicit type annotations work around next-auth v5 beta TS2883
// ("inferred type cannot be named") in monorepos.
export const handlers: NextAuthResult["handlers"] = nextAuth.handlers;
export const auth: NextAuthResult["auth"] = nextAuth.auth;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut;