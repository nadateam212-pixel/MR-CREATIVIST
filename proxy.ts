import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  const isLoggedIn = Boolean(token);
  const role = String((token as { role?: unknown } | null)?.role ?? "").toLowerCase();
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/instructor") ||
    nextUrl.pathname.startsWith("/consultant") ||
    nextUrl.pathname.startsWith("/freelancer") ||
    nextUrl.pathname.startsWith("/seller") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/messages") ||
    nextUrl.pathname.startsWith("/notifications") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/api/posts");

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", nextUrl));
  }

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
