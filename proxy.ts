import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";

function isPathUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const secret = env("AUTH_SECRET") || env("NEXTAUTH_SECRET");
  const secureCookie =
    process.env.NODE_ENV === "production" ||
    nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const token =
    (await getToken({ req: request, secret, secureCookie })) ||
    (await getToken({ req: request, secret, secureCookie: !secureCookie }));
  const isLoggedIn = Boolean(token);
  const role = String((token as { role?: unknown } | null)?.role ?? "").toLowerCase();
  const isAuthRoute = isPathUnder(nextUrl.pathname, "/login") || isPathUnder(nextUrl.pathname, "/register");
  const isProtectedRoute =
    isPathUnder(nextUrl.pathname, "/dashboard") ||
    isPathUnder(nextUrl.pathname, "/studio") ||
    isPathUnder(nextUrl.pathname, "/instructor") ||
    isPathUnder(nextUrl.pathname, "/consultant") ||
    isPathUnder(nextUrl.pathname, "/freelancer") ||
    isPathUnder(nextUrl.pathname, "/seller") ||
    isPathUnder(nextUrl.pathname, "/profile") ||
    isPathUnder(nextUrl.pathname, "/messages") ||
    isPathUnder(nextUrl.pathname, "/notifications") ||
    isPathUnder(nextUrl.pathname, "/settings") ||
    isPathUnder(nextUrl.pathname, "/admin") ||
    isPathUnder(nextUrl.pathname, "/api/posts");

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", nextUrl));
  }

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isPathUnder(nextUrl.pathname, "/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
