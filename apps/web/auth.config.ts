import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (trigger === "update" && session?.name !== undefined) {
        token.name = session.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
