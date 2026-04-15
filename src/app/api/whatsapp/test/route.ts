import { NextRequest, NextResponse } from "next/server"
import { WhatsAppService } from "@/lib/whatsapp"
import { requireAdminAuth } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const body = await request.json().catch(() => null)
    const phone = (() => {
      if (!body || typeof body !== "object") {
        return ""
      }

      const payload = body as { phone?: unknown; customerPhone?: unknown }

      if (typeof payload.phone === "string") {
        return payload.phone.trim()
      }

      if (typeof payload.customerPhone === "string") {
        return payload.customerPhone.trim()
      }

      return ""
    })()

    if (!phone) {
      return NextResponse.json(
        { error: "Informe um telefone para teste." },
        { status: 400 }
      )
    }

    const result = await WhatsAppService.sendTestMessage({
      customerPhone: phone,
    })

    return NextResponse.json({
      success: true,
      provider: result.provider,
      skipped: "skipped" in result ? result.skipped : false,
      messageId: "messageId" in result ? result.messageId : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao testar o robo.",
      },
      { status: 500 }
    )
  }
}
