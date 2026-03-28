import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/db";
import { demoSession } from "@/lib/demo-data";
import { verifyPassword } from "@/lib/security";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        const prisma = getPrisma();
        if (!prisma) {
          if (email === demoSession.email && password === "demo-admin") {
            return demoSession;
          }
          return null;
        }

        const user = await prisma.user.findUnique({ include: { role: true }, where: { email } });
        if (!user || !user.active) {
          return null;
        }

        if (!verifyPassword(password, user.passwordHash)) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.code
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? demoSession.id;
        session.user.role = (token.role as string) ?? demoSession.role;
      }
      return session;
    }
  }
});