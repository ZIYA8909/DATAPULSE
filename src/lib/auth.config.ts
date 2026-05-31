import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

// Edge-compatible auth config (no Prisma adapter)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/overview") ||
        nextUrl.pathname.startsWith("/analytics") ||
        nextUrl.pathname.startsWith("/reports") ||
        nextUrl.pathname.startsWith("/data") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/notifications") ||
        nextUrl.pathname.startsWith("/activity") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")) {
        return Response.redirect(new URL("/overview", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
  providers: [], // Credentials added in auth.ts (not edge compatible)
};
