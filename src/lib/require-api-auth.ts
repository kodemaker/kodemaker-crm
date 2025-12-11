import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Validates authentication for API routes.
 * Returns the session if authenticated, or a 401 response if not.
 * 
 * Usage in API routes:
 * ```
 * const authResult = await requireApiAuth();
 * if (authResult instanceof NextResponse) return authResult;
 * const session = authResult;
 * ```
 */
export async function requireApiAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
