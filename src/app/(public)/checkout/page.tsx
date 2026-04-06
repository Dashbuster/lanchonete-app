"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  MapPin,
  User,
  Phone,
  Truck,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Wallet,
  Receipt,
  X,
  Plus,
  Minus,
} from "lucide-react"
import toast from "react-hot-toast"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

type PaymentMethod =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CASH"
  | "ON_SITE"

type OrderType = "delivery" | "pickup"

type ProductItem = {
  id: string
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  addons: { name: string; price: number }[]
}

export default function CheckoutPage() {
  const { items, total, clearCart, updateQuantity, removeItem } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [orderCode, setOrderCode] = useState("")
  const [orderId, setOrderId] = useState("")

  // Step 1: Info
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [address, setAddress] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("delivery")

  // Step 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX")
  const [cardNumber, setCardNumber] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [installments, setInstallments] = useState("1")
  const [changeFor, setChangeFor] = useState("")
  const [pixPayload, setPixPayload] = useState<string | null>(null)

  const deliveryFee = 5.0
  const subtotal = total()
  const finalTotal = orderType === "delivery" ? subtotal + deliveryFee : subtotal

  const steps = [
    { num: 1, label: "Informações" },
    { num: 2, label: "Pagamento" },
    { num: 3, label: "Confirmação" },
  ]

  const paymentOptions: {
    id: PaymentMethod
    label: string
    icon: React.ReactNode
  }[] = [
    { id: "PIX", label: "PIX", icon: <QrCode className="w-5 h-5" /> },
    { id: "CREDIT_CARD", label: "Cartão de Crédito", icon: <CreditCard className="w-5 h-5" /> },
    { id: "DEBIT_CARD", label: "Cartão de Débito", icon: <CreditCard className="w-5 h-5" /> },
    { id: "CASH", label: "Dinheiro", icon: <Banknote className="w-5 h-5" /> },
    { id: "ON_SITE", label: "Pagar no Local", icon: <Receipt className="w-5 h-5" /> },
  ]

  const handleGeneratePix = useCallback(async () => {
    toast.promise(
      fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          description: `Pedido - ${customerName}`,
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setPixPayload(data.qr_code || data.encrypted_qr_code || "QR Code PIX gerado com sucesso")
          return "QR Code gerado!"
        }
        setPixPayload("QR Code PIX gerado - escaneie para pagar")
        return "QR Code gerado!"
      }),
      {
        loading: "Gerando QR Code...",
        success: "QR Code PIX gerado!",
        error: "Erro ao gerar QR Code, tente outro método",
      }
    )
  }, [finalTotal, customerName])

  const validateStep1 = (): boolean => {
    if (!customerName.trim()) {
      toast.error("Informe seu nome")
      return false
    }
    if (!customerPhone.trim()) {
      toast.error("Informe seu telefone")
      return false
    }
    if (orderType === "delivery" && !address.trim()) {
      toast.error("Informe o endereço de entrega")
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (paymentMethod === "CREDIT_CARD") {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, "").length < 16) {
        toast.error("Número do cartão inválido")
        return false
      }
      if (!cardholderName.trim()) {
        toast.error("Nome do titular é obrigatório")
        return false
      }
      if (!expiry.trim() || !/^\d{2}\/\d{2}$/.test(expiry)) {
        toast.error("Validade do cartão no formato MM/AA")
        return false
      }
      if (!cvv.trim() || cvv.length < 3) {
        toast.error("CVV inválido")
        return false
      }
    }
    if (paymentMethod === "CASH" && changeFor) {
      const val = parseFloat(changeFor.replace(",", "."))
      if (isNaN(val) || val <= finalTotal) {
        toast.error("Troco deve ser maior que o total")
        return false
      }
    }
    return true
  }

  const handleConfirmOrder = async () => {
    if (!validateStep2()) return
    setLoading(true)

    try {
      const changeValue =
        paymentMethod === "CASH" && changeFor
          ? parseFloat(changeFor.replace(",", "."))
          : null

      const body = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: orderType === "delivery" ? address.trim() : null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          observations: item.observations || null,
        })),
        paymentMethod,
        changeFor: changeValue,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar pedido")
      }

      const data = await res.json()
      const code = `#${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`
      setOrderCode(code)
      setOrderId(data.id)
      clearCart()
      setStep(3)
      toast.success("Pedido realizado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar pedido")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && step < 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold text-dark-300">
            Carrinho vazio
          </h2>
          <p className="text-dark-400 mt-2">
            Adicione itens ao carrinho antes de finalizar
          </p>
          <Button onClick={() => router.push("/")} className="mt-6">
            Ver Cardápio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Steps indicator */}
      {step < 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                    step >= s.num
                      ? "bg-brand-500 text-white"
                      : "bg-dark-700 text-dark-400"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span
                  className={`ml-2 mr-2 text-sm font-medium hidden sm:block ${
                    step >= s.num ? "text-white" : "text-dark-400"
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-1 ${
                      step > s.num ? "bg-brand-500" : "bg-dark-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Pedido Realizado!
          </h2>
          <p className="text-dark-300 mt-2">
            Acompanhe seu pedido pelo código
          </p>
          <p className="text-3xl font-bold text-brand-500 mt-3">
            {orderCode}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              onClick={() => router.push(`/pedido/${orderId}`)}
              size="lg"
            >
              Acompanhar Pedido
            </Button>
            <Button onClick={() => router.push("/")} variant="secondary" size="lg">
              Voltar ao Cardápio
            </Button>
          </div>
        </div>
      )}

      <div className={step === 3 ? "hidden" : "grid lg:grid-cols-3 gap-8"}>
        {/* Main Form */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">
                Informações para Entrega
              </h2>

              <div className="space-y-4">
                {/* Order Type */}
                <div>
                  <label className="text-sm font-medium text-dark-200 mb-2 block">
                    Tipo de Pedido
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType("delivery")}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        orderType === "delivery"
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-dark-600 bg-dark-800"
                      }`}
                    >
                      <Truck
                        className={`w-5 h-5 ${
                          orderType === "delivery"
                            ? "text-brand-500"
                            : "text-dark-400"
                        }`}
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          Entrega
                        </p>
                        <p className="text-xs text-dark-400">
                          Até sua casa
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setOrderType("pickup")}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        orderType === "pickup"
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-dark-600 bg-dark-800"
                      }`}
                    >
                      <Store
                        className={`w-5 h-5 ${
                          orderType === "pickup"
                            ? "text-brand-500"
                            : "text-dark-400"
                        }`}
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          Retirada
                        </p>
                        <p className="text-xs text-dark-400">
                          No local
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Address (delivery only) */}
                {orderType === "delivery" && (
                  <div>
                    <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                      Endereço de entrega
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-dark-400" />
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua, número, bairro, complemento..."
                        className="w-full pl-10 px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => router.push("/")}
                  variant="secondary"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    if (validateStep1()) setStep(2)
                  }}
                  className="flex-1"
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">
                Forma de Pagamento
              </h2>

              {/* Payment method selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center ${
                      paymentMethod === option.id
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-dark-600 bg-dark-800 hover:border-dark-500"
                    }`}
                  >
                    <span
                      className={
                        paymentMethod === option.id
                          ? "text-brand-500"
                          : "text-dark-400"
                      }
                    >
                      {option.icon}
                    </span>
                    <span className="text-sm text-white font-medium">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment details */}
              {paymentMethod === "PIX" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center space-y-4">
                    <QrCode className="w-12 h-12 mx-auto text-brand-500" />
                    <p className="text-dark-300 text-sm">
                      Gere o QR Code PIX para pagar
                    </p>
                    <Button
                      onClick={handleGeneratePix}
                      variant="secondary"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Gerar QR Code
                    </Button>
                    {pixPayload && (
                      <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                        <p className="text-sm text-dark-300 break-all font-mono">
                          {pixPayload}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "CREDIT_CARD" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                      Número do Cartão
                    </label>
                    <Input
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(
                          e.target.value
                            .replace(/\D/g, "")
                            .replace(/(.{4})/g, "$1 ")
                            .trim()
                        )
                      }
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                      Nome no Cartão
                    </label>
                    <Input
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Nome como está no cartão"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                        Validade
                      </label>
                      <Input
                        value={expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "")
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4)
                          setExpiry(v)
                        }}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                        CVV
                      </label>
                      <Input
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                      Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="1">1x de R$ {finalTotal.toFixed(2).replace(".", ",")} sem juros</option>
                      {finalTotal >= 30 && (
                        <option value="2">2x de R$ {(finalTotal / 2).toFixed(2).replace(".", ",")} sem juros</option>
                      )}
                      {finalTotal >= 60 && (
                        <>
                          <option value="3">3x de R$ {(finalTotal / 3).toFixed(2).replace(".", ",")} sem juros</option>
                          <option value="4">4x de R$ {(finalTotal / 4).toFixed(2).replace(".", ",")} sem juros</option>
                          <option value="5">5x de R$ {(finalTotal / 5).toFixed(2).replace(".", ",")} sem juros</option>
                          <option value="6">6x de R$ {(finalTotal / 6).toFixed(2).replace(".", ",")} sem juros</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === "DEBIT_CARD" && (
                <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center space-y-3">
                  <CreditCard className="w-12 h-12 mx-auto text-brand-500" />
                  <p className="text-dark-300 text-sm">
                    Pague com cartão de débito na entrega
                  </p>
                  <p className="text-dark-400 text-xs">
                    A maquininha será levada pelo entregador
                  </p>
                </div>
              )}

              {paymentMethod === "CASH" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 space-y-4">
                    <Banknote className="w-10 h-10 text-brand-500" />
                    <p className="text-dark-300 text-sm">
                      Pagamento em dinheiro na entrega
                    </p>
                    <div>
                      <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                        Troco para quanto?
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">
                          R$
                        </span>
                        <Input
                          value={changeFor}
                          onChange={(e) =>
                            setChangeFor(
                              e.target.value.replace(/[^0-9.,]/g, "")
                            )
                          }
                          placeholder="Ex: 50,00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "ON_SITE" && (
                <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center space-y-3">
                  <Receipt className="w-12 h-12 mx-auto text-brand-500" />
                  <p className="text-dark-300 text-sm">
                    Pague no local após a retirada ou entrega
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="secondary"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirmOrder}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-500" />
                Resumo do Pedido
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item: ProductItem) => {
                  const itemTotal =
                    (item.price +
                      item.addons.reduce((s: number, a: { price: number }) => s + a.price, 0)) *
                    item.quantity

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-dark-700">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-sm">🍔</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {item.quantity}x {item.name}
                        </p>
                        {item.addons.length > 0 && (
                          <p className="text-xs text-dark-400 line-clamp-1">
                            + {item.addons.map((a: { name: string }) => a.name).join(", ")}
                          </p>
                        )}
                        <p className="text-sm font-medium text-brand-500">
                          R$ {itemTotal.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          className="p-1 text-dark-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          className="p-1 text-dark-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-dark-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-dark-600 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">Subtotal</span>
                  <span className="text-white">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">Taxa de entrega</span>
                    <span className="text-white">
                      R$ {deliveryFee.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-dark-600">
                  <span className="text-white">Total</span>
                  <span className="text-brand-500">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
