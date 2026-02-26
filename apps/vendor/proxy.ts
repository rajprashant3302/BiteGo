import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Public Routes (Vendor onboarding usually happens here)
  const publicRoutes = ["/login", "/register", "/onboarding", "/unauthorised"];

  if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 2. Verify Token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Role Check: VENDOR OR ADMIN
  const role = token.role as string;
  if (role !== "VENDOR" && role !== "ADMIN") {
    // Redirect unauthorized users (e.g., Drivers/Customers trying to access Vendor dashboard)
    return NextResponse.redirect(new URL("/unauthorised", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};