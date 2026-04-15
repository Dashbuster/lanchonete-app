"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Store,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useCart } from "@/hooks/useCart"
import type { PublicSiteSettings } from "@/lib/public-settings"

type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "ON_SITE"
type OrderType = "delivery" | "pickup"

const paymentCatalog = [
  {
    id: "PIX" as PaymentMethod,
    title: "PIX online",
    description: "Gera QR Code apos criar o pedido.",
    icon: QrCode,
  },
  {
    id: "CREDIT_CARD" as PaymentMethod,
    title: "Credito",
    description: "Pagamento na maquininha na entrega ou retirada.",
    icon: CreditCard,
  },
  {
    id: "DEBIT_CARD" as PaymentMethod,
    title: "Debito",
    description: "Pagamento na maquininha.",
    icon: Wallet,
  },
  {
    id: "CASH" as PaymentMethod,
    title: "Dinheiro",
    description: "Receba troco na entrega ou retirada.",
    icon: Banknote,
  },
  {
    id: "ON_SITE" as PaymentMethod,
    title: "No balcao",
    description: "Pague quando chegar ao local.",
    icon: Receipt,
  },
]

export function CheckoutClient({ settings }: { settings: PublicSiteSettings }) {
  const router = useRouter()
  const { items, clearCart, removeItem, total, updateQuantity } = useCart()

  const [submitting, setSubmitting] = useState(false)
  const [finishedOrderId, setFinishedOrderId] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("delivery")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [address, setAddress] = useState("")
  const [changeFor, setChangeFor] = useState("")
  const [pixCode, setPixCode] = useState("")
  const [pixQrBase64, setPixQrBase64] = useState("")
  const [pixTicketUrl, setPixTicketUrl] = useState("")

  const paymentOptions = useMemo(
    () => paymentCatalog.filter((option) => settings.paymentMethods[option.id]),
    [settings.paymentMethods]
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentOptions[0]?.id || "PIX"
  )

  const subtotal = total()
  const deliveryFee = orderType === "delivery" ? settings.deliveryFee : 0
  const finalTotal = subtotal + deliveryFee

  function validateForm() {
    if (!items.length) {
      toast.error("Seu carrinho esta vazio.")
      return false
    }

    if (!settings.storeOpen) {
      toast.error("A loja esta fechada no momento.")
      return false
    }

    if (subtotal < settings.minOrderValue) {
      toast.error(
        `O pedido minimo e R$ ${settings.minOrderValue.toFixed(2).replace(".", ",")}.`
      )
      return false
    }

    if (!customerName.trim()) {
      toast.error("Informe seu nome.")
      return false
    }

    if (!customerPhone.trim()) {
      toast.error("Informe seu telefone.")
      return false
    }

    if (orderType === "delivery" && !address.trim()) {
      toast.error("Informe o endereco de entrega.")
      return false
    }

    if (orderType === "pickup" && !settings.acceptsPickup) {
      toast.error("A loja nao esta aceitando retirada no momento.")
      return false
    }

    if (paymentMethod === "CASH" && changeFor) {
      const value = Number(changeFor.replace(",", "."))

      if (Number.isNaN(value) || value < finalTotal) {
        toast.error("O valor do troco precisa ser maior ou igual ao total.")
        return false
      }
    }

    return true
  }

  async function handleSubmitOrder() {
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          address: orderType === "delivery" ? address.trim() : null,
          paymentMethod,
          changeFor: changeFor ? Number(changeFor.replace(",", ".")) : null,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            observations: item.observations || null,
            addonIds: item.addons.map((addon) => addon.id),
          })),
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Nao foi possivel criar o pedido.")
      }

      setFinishedOrderId(orderData.id)

      if (paymentMethod === "PIX") {
        const pixResponse = await fetch("/api/payments/pix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderData.id,
          }),
        })

        const pixData = await pixResponse.json()

        if (pixResponse.ok) {
          setPixCode(pixData.qrCode || "")
          setPixQrBase64(pixData.qrCodeBase64 || "")
          setPixTicketUrl(pixData.ticketUrl || pixData.init_point || "")
        } else {
          toast.error(
            pixData.details || pixData.error || "Pedido criado, mas nao foi possivel gerar o PIX agora."
          )
        }
      }

      clearCart()
      toast.success("Pedido confirmado com sucesso.")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar pedido.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length && !finishedOrderId) {
    return (
      <div className="section-shell flex min-h-[70vh] items-center justify-center py-12">
        <div className="glass-panel max-w-lg rounded-[32px] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.05]">
            <Store className="h-9 w-9 text-brand-300" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-white">Carrinho vazio</h1>
          <p className="mt-3 text-sm leading-7 text-dark-200">
            Adicione itens ao carrinho antes de seguir para o checkout.
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Voltar ao cardapio
          </Button>
        </div>
      </div>
    )
  }

  if (finishedOrderId) {
    return (
      <div className="section-shell py-10">
        <div className="mx-auto max-w-3xl rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(12,14,14,0.98)_52%)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
            Pedido concluido
          </p>
          <h1 className="mt-2 text-4xl font-black text-white">Pedido recebido</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-dark-100">
            Seu pedido foi criado e esta pronto para acompanhamento. O codigo do
            pedido e <span className="font-bold text-white">{finishedOrderId}</span>.
          </p>

          {paymentMethod === "PIX" && (
            <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-brand-300" />
                <h2 className="text-xl font-bold text-white">Pagamento via PIX</h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-dark-200">
                Copie o codigo abaixo no app do banco. Se o provedor retornar um
                link de pagamento, ele tambem aparecera aqui.
              </p>

              {pixQrBase64 && (
                <div className="mt-4 flex justify-center rounded-2xl border border-white/10 bg-white p-4">
                  <img
                    src={`data:image/png;base64,${pixQrBase64}`}
                    alt="QR Code PIX"
                    className="h-56 w-56 rounded-lg object-contain"
                  />
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="break-all text-sm text-white">
                  {pixCode || "O codigo PIX nao foi retornado. Use o link abaixo se disponivel."}
                </p>
              </div>

              {pixTicketUrl && (
                <a
                  href={pixTicketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-dark-900 transition hover:bg-brand-100"
                >
                  Abrir link do pagamento
                </a>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => router.push(`/pedido/${finishedOrderId}`)}>
              Acompanhar pedido
            </Button>
            <Button variant="secondary" onClick={() => router.push("/")}>
              Voltar ao cardapio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-shell py-8">
      <button
        onClick={() => router.push("/")}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-dark-100 transition-all duration-300 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Voltar ao cardapio
      </button>

      {/* Step Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-0">
          {[
            { label: "Dados", done: !!customerName.trim() },
            { label: "Pagamento", done: true },
            { label: "Resumo", done: true },
          ].map((step, idx) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                    idx === 0
                      ? "bg-brand-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse-glow"
                      : step.done
                        ? "bg-emerald-500 text-white"
                        : "border border-white/10 bg-white/[0.04] text-dark-300"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-dark-300">
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="mx-3 h-0.5 w-12 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-700"
                    style={{ width: step.done ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="animate-fade-in-up rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Etapa 1
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              Dados do pedido
            </h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setOrderType("delivery")}
                className={`rounded-[28px] border p-5 text-left transition-all duration-300 ${
                  orderType === "delivery"
                    ? "border-brand-500 bg-brand-500/10 shadow-[0_0_30px_rgba(249,115,22,0.08)] scale-[1.02]"
                    : "border-white/10 bg-black/10 hover:border-white/15 hover:bg-white/[0.04]"
                }`}
              >
                <Truck className="h-6 w-6 text-brand-300 transition-transform duration-300 group-hover:translate-x-1" />
                <p className="mt-4 text-lg font-bold text-white">Entrega</p>
                <p className="mt-2 text-sm leading-7 text-dark-200">
                  Pedido vai ate o endereco informado.
                </p>
              </button>

              <button
                onClick={() => settings.acceptsPickup && setOrderType("pickup")}
                disabled={!settings.acceptsPickup}
                className={`rounded-[28px] border p-5 text-left transition-all duration-300 ${
                  orderType === "pickup"
                    ? "border-brand-500 bg-brand-500/10 shadow-[0_0_30px_rgba(249,115,22,0.08)] scale-[1.02]"
                    : "border-white/10 bg-black/10 hover:border-white/15 hover:bg-white/[0.04]"
                } ${!settings.acceptsPickup ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <Store className="h-6 w-6 text-brand-300" />
                <p className="mt-4 text-lg font-bold text-white">Retirada</p>
                <p className="mt-2 text-sm leading-7 text-dark-200">
                  {settings.acceptsPickup
                    ? "Voce paga e retira no balcao se quiser."
                    : "Retirada desativada nas configuracoes da loja."}
                </p>
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Nome completo
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <Input
                    className="pl-11"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Telefone
                </label>
                <Input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {orderType === "delivery" && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Endereco de entrega
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-dark-300" />
                  <Textarea
                    className="pl-11"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Rua, numero, bairro, ponto de referencia..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Etapa 2
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              Forma de pagamento
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon

                return (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`rounded-[28px] border p-5 text-left transition-all duration-300 ${
                      paymentMethod === option.id
                        ? "border-brand-500 bg-brand-500/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-[1.02]"
                        : "border-white/10 bg-black/10 hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`h-6 w-6 transition-colors duration-300 ${
                      paymentMethod === option.id ? "text-brand-300" : "text-brand-300"
                    }`} />
                    <p className="mt-4 text-base font-bold text-white">
                      {option.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-dark-200">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {paymentMethod === "CASH" && (
              <div className="mt-6 max-w-sm">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Troco para quanto?
                </label>
                <Input
                  value={changeFor}
                  onChange={(event) =>
                    setChangeFor(event.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder="Ex.: 80,00"
                />
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
            Resumo
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Seu pedido
          </h2>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-dark-200">
            Pedido minimo: R$ {settings.minOrderValue.toFixed(2).replace(".", ",")}
          </div>

          <div className="mt-6 space-y-4">
            {items.map((item) => {
              const itemTotal =
                (item.price + item.addons.reduce((sum, addon) => sum + addon.price, 0)) *
                item.quantity

              return (
                <article
                  key={item.id}
                  className="rounded-[28px] border border-white/10 bg-black/15 p-4"
                >
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/[0.05]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.35),rgba(20,15,11,0.9))] text-xl">
                          🍔
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="truncate text-sm font-bold text-white">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-dark-200">
                            R$ {itemTotal.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs font-semibold text-brand-200 transition hover:text-white"
                        >
                          Remover
                        </button>
                      </div>

                      {item.addons.length > 0 && (
                        <p className="mt-2 text-xs leading-6 text-dark-300">
                          {item.addons.map((addon) => addon.name).join(", ")}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-dark-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.1] hover:text-white active:scale-95"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-dark-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.1] hover:text-white active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex items-center justify-between text-dark-200">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex items-center justify-between text-dark-200">
              <span>Entrega</span>
              <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={submitting || paymentOptions.length === 0}
            onClick={handleSubmitOrder}
          >
            {submitting ? "Criando pedido..." : "Confirmar pedido"}
          </Button>
        </aside>
      </div>
    </div>
  )
}
