import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const STATIC_ASSET_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|ico|webp|woff|woff2|ttf|eot)$/i;

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/emails") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    STATIC_ASSET_EXTENSIONS.test(pathname)
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and auth endpoints
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get token (handles missing NEXTAUTH_SECRET via getToken's error handling)
  let token;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error("Error getting token in middleware:", error);
  }

  if (!token) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - api/emails (webhook)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    "/((?!api/auth|api/emails|_next/static|_next/image).*)",
  ],
};
