// apps/user/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// RENAME THIS TO middleware
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedRoutes = ["/checkout", "/profile", "/orders", "/settings"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 1. If not protected, let it pass
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 2. Check for token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  // This matcher excludes internal files and the auth API itself
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};