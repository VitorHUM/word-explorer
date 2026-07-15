import { AUTH_COOKIE_NAME } from "@/lib/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register"];
const sessionExpiredReason = "session-expired";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isSessionExpiredLogin =
    pathname === "/login" &&
    searchParams.get("reason") === sessionExpiredReason;

  if (token && isSessionExpiredLogin) {
    const response = NextResponse.next();
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
