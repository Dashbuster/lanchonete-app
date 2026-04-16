import { prisma } from "./prisma"

type WhatsAppProvider = "SIMULATED" | "WEBHOOK" | "EVOLUTION" | "META"
type WhatsAppMessageType =
  | "ORDER_CONFIRMATION"
  | "PAYMENT_CONFIRMED"
  | "OUT_FOR_DELIVERY"
  | "TEST"

interface BaseMessageParams {
  orderId?: string
  customerPhone: string
  customerName: string
}

interface OrderConfirmationParams extends BaseMessageParams {
  orderId: string
  total: number
  orderCode: string
}

interface PaymentConfirmedParams extends BaseMessageParams {
  orderId: string
  total: number
  orderCode: string
}

interface OutForDeliveryParams extends BaseMessageParams {
  orderId: string
  orderCode: string
}

interface RobotTestParams {
  customerPhone: string
}

interface WhatsAppConfig {
  enabled: boolean
  provider: WhatsAppProvider
  apiUrl: string
  instance: string
  token: string
  metaPhoneNumberId: string
  storeName: string
}

interface SendMessageParams {
  type: WhatsAppMessageType
  phoneNumber: string
  customerName: string
  message: string
  orderId?: string
}

interface WhatsAppSendResult {
  success: true
  provider: WhatsAppProvider
  messageId: string
  sentAt: Date
}

interface WhatsAppSkippedResult {
  success: false
  skipped: true
  reason: string
  provider: WhatsAppProvider
}

const REQUEST_TIMEOUT_MS = 15000

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "")
}

function isLikelyValidPhone(phone: string) {
  return normalizePhone(phone).length >= 10
}

function normalizeProvider(value: string | null | undefined): WhatsAppProvider {
  if (value === "WEBHOOK" || value === "EVOLUTION" || value === "META") {
    return value
  }

  return "SIMULATED"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

async function readErrorBody(response: Response) {
  try {
    const text = await response.text()
    return text.trim()
  } catch {
    return ""
  }
}

export class WhatsAppService {
  static async sendOrderConfirmation(params: OrderConfirmationParams) {
    return this.sendMessage({
      type: "ORDER_CONFIRMATION",
      phoneNumber: params.customerPhone,
      orderId: params.orderId,
      customerName: params.customerName,
      message: this.generateOrderConfirmationMessage(params),
    })
  }

  static async sendPaymentConfirmed(params: PaymentConfirmedParams) {
    return this.sendMessage({
      type: "PAYMENT_CONFIRMED",
      phoneNumber: params.customerPhone,
      orderId: params.orderId,
      customerName: params.customerName,
      message: this.generatePaymentConfirmedMessage(params),
    })
  }

  static async sendOutForDelivery(params: OutForDeliveryParams) {
    return this.sendMessage({
      type: "OUT_FOR_DELIVERY",
      phoneNumber: params.customerPhone,
      orderId: params.orderId,
      customerName: params.customerName,
      message: this.generateOutForDeliveryMessage(params),
    })
  }

  static async sendTestMessage(params: RobotTestParams) {
    return this.sendMessage({
      type: "TEST",
      phoneNumber: params.customerPhone,
      customerName: "Cliente",
      message: this.generateTestMessage(),
    })
  }

  private static async getConfig(): Promise<WhatsAppConfig> {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "store_name",
            "whatsapp_robot_enabled",
            "whatsapp_provider",
            "whatsapp_api_url",
            "whatsapp_instance",
            "whatsapp_token",
            "whatsapp_meta_phone_number_id",
          ],
        },
      },
    })

    const map = new Map(settings.map((setting) => [setting.key, setting.value]))

    return {
      enabled: ["true", "1", "yes"].includes(
        (map.get("whatsapp_robot_enabled") || "").toLowerCase()
      ),
      provider: normalizeProvider(map.get("whatsapp_provider")),
      apiUrl: map.get("whatsapp_api_url") || "",
      instance: map.get("whatsapp_instance") || "",
      token: map.get("whatsapp_token") || "",
      metaPhoneNumberId: map.get("whatsapp_meta_phone_number_id") || "",
      storeName: map.get("store_name")?.trim() || "Lanchonete",
    }
  }

  private static async sendMessage(params: SendMessageParams): Promise<WhatsAppSendResult | WhatsAppSkippedResult> {
    const config = await this.getConfig()
    const normalizedPhone = normalizePhone(params.phoneNumber)
    const message = this.withStoreName(config.storeName, params.message)

    if (!normalizedPhone) {
      throw new Error("Informe um telefone valido para o WhatsApp.")
    }

    if (!isLikelyValidPhone(normalizedPhone)) {
      throw new Error("Telefone invalido para envio no WhatsApp.")
    }

    if (!config.enabled && params.type !== "TEST") {
      return {
        success: false,
        skipped: true,
        reason: "Robo do WhatsApp desativado nas configuracoes.",
        provider: config.provider,
      }
    }

    try {
      if (config.provider === "WEBHOOK") {
        await this.sendViaWebhook(
          config,
          normalizedPhone,
          params.customerName,
          message,
          params.type,
          params.orderId
        )
      } else if (config.provider === "EVOLUTION") {
        await this.sendViaEvolution(
          config,
          normalizedPhone,
          params.customerName,
          message,
          params.type,
          params.orderId
        )
      } else if (config.provider === "META") {
        await this.sendViaMeta(
          config,
          normalizedPhone,
          message
        )
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      await this.recordLog({
        phoneNumber: normalizedPhone,
        message,
        type: params.type,
        orderId: params.orderId,
        status: "SENT",
      })

      return {
        success: true,
        provider: config.provider,
        messageId: `msg_${Date.now()}`,
        sentAt: new Date(),
      }
    } catch (error) {
      await this.recordLog({
        phoneNumber: normalizedPhone,
        message,
        type: params.type,
        orderId: params.orderId,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      })

      throw error
    }
  }

  private static withStoreName(storeName: string, message: string) {
    return message.replaceAll("__STORE_NAME__", storeName.trim() || "Lanchonete")
  }

  private static async recordLog(params: {
    phoneNumber: string
    message: string
    type: WhatsAppMessageType
    orderId?: string
    status: "SENT" | "FAILED" | "PENDING"
    errorMessage?: string
  }) {
    try {
      await prisma.whatsAppLog.create({
        data: {
          phoneNumber: params.phoneNumber,
          message: params.message,
          type: params.type,
          orderId: params.orderId,
          status: params.status,
          errorMessage: params.errorMessage,
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Falha ao registrar log de WhatsApp:", error)
    }
  }

  private static async sendViaWebhook(
    config: WhatsAppConfig,
    phoneNumber: string,
    customerName: string,
    message: string,
    type: WhatsAppMessageType,
    orderId?: string
  ) {
    if (!config.apiUrl) {
      throw new Error("URL do webhook do WhatsApp nao configurada.")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          phone: phoneNumber,
          phoneNumber,
          text: message,
          message,
          type,
          orderId,
          customerName,
          source: "lanchonete-app",
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const details = await readErrorBody(response)
        throw new Error(
          `Falha ao enviar mensagem pelo webhook configurado (${response.status}${
            response.statusText ? ` ${response.statusText}` : ""
          })${details ? `: ${details}` : ""}`
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout ao enviar mensagem pelo webhook do WhatsApp.")
      }

      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  private static async sendViaEvolution(
    config: WhatsAppConfig,
    phoneNumber: string,
    customerName: string,
    message: string,
    type: WhatsAppMessageType,
    orderId?: string
  ) {
    if (!config.apiUrl || !config.instance || !config.token) {
      throw new Error("Evolution API incompleta. Informe URL, instancia e token.")
    }

    const apiUrl = `${config.apiUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(
      config.instance
    )}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.token,
          Authorization: `Bearer ${config.token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          number: phoneNumber,
          phone: phoneNumber,
          text: message,
          message,
          customerName,
          type,
          orderId,
        }),
      })

      if (!response.ok) {
        const details = await readErrorBody(response)
        throw new Error(
          `Falha ao enviar mensagem pela Evolution API (${response.status}${
            response.statusText ? ` ${response.statusText}` : ""
          })${details ? `: ${details}` : ""}`
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout ao enviar mensagem pela Evolution API.")
      }

      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  private static async sendViaMeta(
    config: WhatsAppConfig,
    phoneNumber: string,
    message: string
  ) {
    if (!config.token || !config.metaPhoneNumberId) {
      throw new Error("Meta Cloud API incompleta. Informe token e Phone Number ID.")
    }

    const apiUrl = `https://graph.facebook.com/v23.0/${encodeURIComponent(
      config.metaPhoneNumberId
    )}/messages`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      })

      if (!response.ok) {
        const details = await readErrorBody(response)
        throw new Error(
          `Falha ao enviar mensagem pela Meta Cloud API (${response.status}${
            response.statusText ? ` ${response.statusText}` : ""
          })${details ? `: ${details}` : ""}`
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout ao enviar mensagem pela Meta Cloud API.")
      }

      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  private static generateOrderConfirmationMessage(params: OrderConfirmationParams) {
    return [
      "__STORE_NAME__ - pedido confirmado",
      "",
      `Ola ${params.customerName}!`,
      `Recebemos seu pedido ${params.orderCode}.`,
      `Total: ${formatCurrency(params.total)}`,
      "Estamos preparando tudo e vamos te avisar das proximas etapas.",
    ].join("\n")
  }

  private static generatePaymentConfirmedMessage(params: PaymentConfirmedParams) {
    return [
      "__STORE_NAME__ - pagamento aprovado",
      "",
      `${params.customerName}, o pagamento do pedido ${params.orderCode} foi confirmado.`,
      `Valor aprovado: ${formatCurrency(params.total)}`,
      "Seu pedido entrou na fila de preparo.",
    ].join("\n")
  }

  private static generateOutForDeliveryMessage(params: OutForDeliveryParams) {
    return [
      "__STORE_NAME__ - pedido a caminho",
      "",
      `${params.customerName}, o pedido ${params.orderCode} esta saindo para entrega.`,
      "Fique atento ao telefone e ao endereco informado.",
    ].join("\n")
  }

  private static generateTestMessage() {
    return [
      "__STORE_NAME__ - teste do robo",
      "",
      "A integracao do WhatsApp foi configurada com sucesso.",
      "Se voce recebeu esta mensagem, o canal esta pronto para automacoes.",
    ].join("\n")
  }
}
