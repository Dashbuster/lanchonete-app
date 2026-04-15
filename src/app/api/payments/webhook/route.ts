import { createHmac } from "crypto"
import { NextResponse } from "next/server"
import { mpPayment } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"
import { WhatsAppService } from "@/lib/whatsapp"
import { OrderStatus, PaymentMethod } from "@/types"

function isValidMercadoPagoSignature(request: Request, paymentId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET

  if (!secret) {
    return true
  }

  const xSignature = request.headers.get("x-signature")
  const xRequestId = request.headers.get("x-request-id")

  if (!xSignature || !xRequestId) {
    return false
  }

  let ts = ""
  let hash = ""

  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=").map((entry) => entry?.trim())

    if (key === "ts") {
      ts = value || ""
    }

    if (key === "v1") {
      hash = value || ""
    }
  }

  if (!ts || !hash) {
    return false
  }

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`
  const generatedHash = createHmac("sha256", secret).update(manifest).digest("hex")

  return generatedHash === hash
}

function extractEventType(body: unknown) {
  if (!body || typeof body !== "object") {
    return ""
  }

  const payload = body as {
    type?: unknown
    topic?: unknown
    action?: unknown
  }
  const candidate = payload.type ?? payload.topic ?? payload.action

  return typeof candidate === "string" ? candidate.toLowerCase() : ""
}

function extractPaymentId(body: unknown) {
  if (!body || typeof body !== "object") {
    return null
  }

  const payload = body as {
    data?: { id?: string | number; payment_id?: string | number }
    id?: string | number
    payment_id?: string | number
  }

  const value = payload.data?.id ?? payload.data?.payment_id ?? payload.id ?? payload.payment_id

  if (value === undefined || value === null) {
    return null
  }

  return String(value)
}

function mapPaymentMethod(payment: {
  payment_method_id?: string | null
  payment_type_id?: string | null
}): PaymentMethod {
  const paymentType = String(payment.payment_type_id || "").toLowerCase()
  const paymentMethod = String(payment.payment_method_id || "").toLowerCase()

  if (paymentMethod === "pix" || paymentType === "bank_transfer") {
    return PaymentMethod.PIX
  }

  if (paymentType === "credit_card") {
    return PaymentMethod.CREDIT_CARD
  }

  if (paymentType === "debit_card") {
    return PaymentMethod.DEBIT_CARD
  }

  if (paymentType === "account_money") {
    return PaymentMethod.MERCADO_PAGO
  }

  if (paymentType === "cash" || paymentType === "ticket") {
    return PaymentMethod.CASH
  }

  return PaymentMethod.PIX
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) {
    return null
  }

  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 ? digits : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const eventType = extractEventType(body)
    const paymentId = extractPaymentId(body)

    if (eventType && !eventType.includes("payment") && !paymentId) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    if (!paymentId) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    if (!isValidMercadoPagoSignature(request, paymentId)) {
      return NextResponse.json(
        { error: "Assinatura de webhook invalida" },
        { status: 401 }
      )
    }

    const payment = await mpPayment.get({ id: paymentId })
    const orderId = payment.metadata?.orderId || payment.external_reference

    if (!orderId) {
      console.error("Webhook: no orderId found in payment metadata")
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!currentOrder) {
      console.error(`Webhook: order ${orderId} not found`)
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    const paymentStatus = String(payment.status || "").toLowerCase()
    const customerPhone = normalizePhone(currentOrder.customerPhone)
    const customerName = currentOrder.customerName || "Cliente"
    const orderCode = currentOrder.id.slice(0, 8).toUpperCase()

    if (paymentStatus === "approved" || paymentStatus === "authorized") {
      if (currentOrder.status !== OrderStatus.PENDING) {
        return NextResponse.json({ received: true, ignored: true }, { status: 200 })
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentMethod: mapPaymentMethod(payment),
        },
      })

      if (customerPhone) {
        WhatsAppService.sendPaymentConfirmed({
          orderId: updatedOrder.id,
          customerPhone,
          customerName,
          total: Number(updatedOrder.total),
          orderCode,
        }).catch((error) => {
          console.error("Falha ao enviar confirmacao de pagamento:", error)
        })
      }
    } else if (
      paymentStatus === "rejected" ||
      paymentStatus === "cancelled" ||
      paymentStatus === "charged_back"
    ) {
      if (
        currentOrder.status === OrderStatus.PENDING ||
        currentOrder.status === OrderStatus.CONFIRMED
      ) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            paymentMethod: mapPaymentMethod(payment),
          },
        })
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar webhook",
        received: true,
      },
      { status: 200 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint active" })
}
