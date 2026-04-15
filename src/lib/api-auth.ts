import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER", "CASHIER"]);

export type AdminAuthResult =
  | { success: true; token: NonNullable<Awaited<ReturnType<typeof getToken>>> }
  | { success: false; response: NextResponse };

export async function requireAdminAuth(req: NextRequest): Promise<AdminAuthResult> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.role || !ADMIN_ROLES.has(token.role as string)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      ),
    };
  }

  return { success: true, token };
}
