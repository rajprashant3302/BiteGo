// apps/user/auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL = process.env.AUTH_SERVICE_URL!;

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          response_type: "code",
        },
      },
    }),

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

        return {
          id: data.user.id.toString(),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          accessToken: data.token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.email = user.email;
        token.name = user.name;
      }

      // if (account?.provider === "google") {
      //   const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ idToken: account.id_token }),
      //   });

      //   const data = await res.json();

      //   token.id = data.user.id;
      //   token.role = data.user.role;
      //   token.email = data.user.email;
      //   token.name = data.user.name;
      //   token.accessToken = data.token;
      // }

      if (account?.provider === "google") {
  try {
    console.log("Backend Url ", BACKEND_URL)
    const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: account.id_token }),
    });

    console.log("Google backend status:", res.status);

    const data = await res.json();
    console.log("Google backend response:", data);

    token.id = data.user.id;
    token.role = data.user.role;
    token.email = data.user.email;
    token.name = data.user.name;
    token.accessToken = data.token;
  } catch (err) {
    console.error("Google backend error:", err);
    throw err;
  }
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
