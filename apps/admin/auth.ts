// apps/admin/auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.AUTH_SERVICE_URL!;

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        // ✅ FIX: Check for both lowercase and Prisma's PascalCase
        const userRole = data.user.role || data.user.Role;

        // 🔒 IMPORTANT: Allow only ADMIN roles
        const allowedRoles = ["SuperAdmin", "Admin", "Ops", "Support"];
        if (!allowedRoles.includes(userRole)) {
          throw new Error("Unauthorized access");
        }

        return {
          // ✅ FIX: Fallbacks added here too
          id: (data.user.id || data.user.UserID).toString(),
          email: data.user.email || data.user.Email,
          name: data.user.name || data.user.Name,
          role: userRole,
          accessToken: data.token || data.accessToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).accessToken = token.accessToken;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
});