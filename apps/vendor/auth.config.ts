import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.AUTH_SERVICE_URL!;

export const authConfig = {
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

        const allowedRoles = ["RestaurantOwner", "Admin", "SuperAdmin"];
        if (!allowedRoles.includes(data.user.role)) {
          throw new Error("Unauthorized access");
        }

        return {
          id: data.user.id.toString(),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          accessToken: data.token,
          restaurantId:
            data.user.restaurantId ||
            data.user.RestaurantID ||
            data.user.restaurant?.RestaurantID ||
            null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.email = user.email;
        token.name = user.name;
        token.restaurantId = user.restaurantId;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).email = token.email as string;
        (session.user as any).name = token.name as string;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).restaurantId = token.restaurantId;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt" as const,
  },

  secret: process.env.NEXTAUTH_SECRET,
};