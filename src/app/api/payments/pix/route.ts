import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mpPayment } from "@/lib/mercadopago"

const pixPaymentSchema = z.object({
  orderId: z.string().min(1, "ID do pedido e obrigatorio"),
})

type MercadoPagoPixResponse = {
  id?: string | number
  status?: string | null
  status_detail?: string | null
  transaction_amount?: number | null
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null
      qr_code_base64?: string | null
      ticket_url?: string | null
    } | null
  } | null
}

function buildPayerEmail(order: { customerPhone: string | null; customerName: string | null }) {
  const digits = order.customerPhone?.replace(/\D/g, "") || "cliente"
  return `cliente.${digits}@lanchonete.app`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = pixPaymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { orderId } = validation.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"

    const payment = (await mpPayment.create({
      body: {
        transaction_amount: Number(order.total),
        description: `Pedido ${order.id.slice(0, 8).toUpperCase()}`,
        payment_method_id: "pix",
        external_reference: order.id,
        notification_url: `${baseUrl}/api/payments/webhook`,
        payer: {
          email: buildPayerEmail(order),
          first_name: order.customerName?.trim() || "Cliente",
        },
        metadata: {
          orderId: order.id,
        },
      },
    })) as MercadoPagoPixResponse

    const transactionData = payment.point_of_interaction?.transaction_data
    const qrCode = transactionData?.qr_code || ""
    const qrCodeBase64 = transactionData?.qr_code_base64 || ""
    const ticketUrl = transactionData?.ticket_url || ""

    if (!qrCode && !ticketUrl) {
      return NextResponse.json(
        {
          error: "Mercado Pago nao retornou os dados do PIX",
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      transactionAmount: payment.transaction_amount,
      qrCode,
      qrCodeBase64,
      ticketUrl,
    })
  } catch (error) {
    console.error("Error creating PIX payment:", error)

    const mpError = error as {
      cause?: { error?: string; message?: string }
      message?: string
    }
    const details =
      mpError.cause?.error || mpError.cause?.message || mpError.message || "Erro ao criar pagamento PIX"

    return NextResponse.json(
      {
        error: "Erro ao criar pagamento PIX",
        details,
      },
      { status: 400 }
    )
  }
}
