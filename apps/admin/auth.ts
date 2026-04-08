import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Login failed");

          // 🔒 IMPORTANT: Restrict to ADMIN only
          const allowedRoles = ["Admin", "SuperAdmin", "Ops", "Support"];

          if (!allowedRoles.includes(data.user.role)) {
            throw new Error("Unauthorized admin access");
          }

          return {
            id: data.user.id.toString(),
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            accessToken: data.token,
          };
        } catch (error: any) {
          throw new Error(error.message);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
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
    maxAge: 8 * 60 * 60, // 🔒 8 hours session for admin
  },

  secret: process.env.NEXTAUTH_SECRET,
});
