import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER", "CASHIER"]);

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    const isApiRoute = req.nextUrl.pathname.startsWith("/admin/api");
    const isUnauthenticated = !token || !token.role || !ADMIN_ROLES.has(token.role as string);

    if (isUnauthenticated) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Nao autorizado" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
