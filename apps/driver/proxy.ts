import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Separate auth routes and public routes
  const authRoutes = ["/login", "/register"]; 
  const publicRoutes = ["/unauthorised", "/"];

  // Ignore static files & NextAuth API completely
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  //(Removed the secureCookie override that was breaking it)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 4. Handle Auth Routes (Login/Register)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute) {
    if (token) {
      return NextResponse.redirect(new URL("/", req.url)); 
    }
    return NextResponse.next();
  }

  // 5. Handle Public Routes
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 6. Token Missing -> Redirect to Login
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 7. Role Check for Driver Application
  const role = token.role as string;
  const allowedRoles = ["SuperAdmin", "Admin", "DeliveryPartner"];
  
  if (!allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorised", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};