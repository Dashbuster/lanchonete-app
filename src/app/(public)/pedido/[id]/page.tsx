"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Truck,
  ChefHat,
  Package,
  XCircle,
  ChevronRight,
} from "lucide-react"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { OrderStatus } from "@/types"

const STATUS_STEPS = [
  {
    status: OrderStatus.PENDING,
    label: "Pendente",
    icon: Clock,
  },
  {
    status: OrderStatus.CONFIRMED,
    label: "Confirmado",
    icon: AlertCircle,
  },
  {
    status: OrderStatus.PREPARING,
    label: "Em Preparo",
    icon: ChefHat,
  },
  {
    status: OrderStatus.READY,
    label: "Pronto",
    icon: Package,
  },
  {
    status: OrderStatus.DELIVERED,
    label: "Entregue",
    icon: Truck,
  },
]

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  ON_SITE: "No Local",
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = typeof params.id === "string" ? params.id : undefined

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setNotFound(true)
      setOrder(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.status === 404) {
        setNotFound(true)
        setOrder(null)
        return
      }
      if (!res.ok) throw new Error("Erro ao buscar pedido")
      const data = await res.json()
      setOrder(data)
      setNotFound(false)
    } catch (err) {
      console.error("Error fetching order:", err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Poll every 10 seconds
  useEffect(() => {
    if (!order) return

    const completeStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
    if (completeStatuses.includes(order.status)) return

    const id = window.setInterval(() => {
      fetchOrder()
    }, 10000)

    return () => clearInterval(id)
  }, [order, fetchOrder])

  const currentStepIndex = useMemo(() => {
    if (!order) return -1
    return STATUS_STEPS.findIndex((s) => s.status === order.status)
  }, [order])

  const isComplete = order && order.status === OrderStatus.DELIVERED
  const isCancelled = order && order.status === OrderStatus.CANCELLED

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto text-brand-500 animate-spin mb-4" />
          <p className="text-dark-300">Buscando pedido...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Search className="w-16 h-16 mx-auto text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold text-dark-300">
            Pedido não encontrado
          </h2>
          <p className="text-dark-400 mt-2">
            Verifique o código e tente novamente
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-brand-500/10 blur-[80px]" />

      {/* Header */}
      <div className="animate-fade-in-up relative mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Acompanhamento em tempo real
            </p>
            <h1 className="mt-2 text-3xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Pedido #{order?.id?.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-dark-400 mt-1 text-sm">
              {order?.createdAt ? formatDate(order.createdAt) : ""}
            </p>
          </div>
          <button
            onClick={fetchOrder}
            className="group rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-dark-400 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Cancelled State */}
      {isCancelled && (
        <div className="animate-scale-in mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center backdrop-blur-sm">
          <XCircle className="w-20 h-20 mx-auto text-red-400 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-300">
            Pedido Cancelado
          </h2>
          <p className="text-dark-300 mt-2">
            Entre em contato para mais informações
          </p>
        </div>
      )}

      {/* Delivered State */}
      {isComplete && (
        <div className="animate-scale-in mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center backdrop-blur-sm">
          <CheckCircle2 className="w-20 h-20 mx-auto text-emerald-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-emerald-300">
            Pedido Entregue!
          </h2>
          <p className="text-dark-300 mt-2">
            Obrigado pela preferência. Bom apetite!
          </p>
        </div>
      )}

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="animate-fade-in-up mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200 mb-6">
            Status do Pedido
          </h3>
          <div className="relative">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex
              const isPast = index < currentStepIndex
              const Icon = step.icon

              return (
                <div
                  key={step.status}
                  className={`flex items-start gap-4 relative ${
                    index < currentStepIndex + 1 ? "animate-fade-in-up" : ""
                  }`}
                  style={index <= currentStepIndex ? { animationDelay: `${index * 120}ms` } : {}}
                >
                  {/* Timeline line */}
                  {index < STATUS_STEPS.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 overflow-hidden rounded-full">
                      {/* Completed segment */}
                      <div
                        className={`absolute inset-0 transition-all duration-700 ${
                          isPast ? "bg-emerald-500" : "bg-dark-600"
                        }`}
                      />
                      {isActive && (
                        <div
                          className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-brand-500/60 to-transparent transition-all duration-700"
                        />
                      )}
                    </div>
                  )}

                  {/* Icon dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all duration-500 ${
                      isPast
                        ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : isActive
                          ? "bg-brand-500 text-white animate-pulse-glow"
                          : "bg-dark-700 text-dark-400 border border-dark-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 pb-8">
                    <p
                      className={`font-semibold transition-colors duration-300 ${
                        isPast
                          ? "text-emerald-400"
                          : isActive
                            ? "text-brand-400"
                            : "text-dark-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-brand-300/60 mt-0.5 animate-pulse">
                        Em andamento...
                      </p>
                    )}
                    {isPast && (
                      <p className="text-xs text-dark-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Concluído
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="animate-fade-in-up space-y-6" style={{ animationDelay: "300ms" }}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200 mb-4">
              Detalhes do Pedido
            </h3>

            {/* Items */}
            <div className="space-y-2 mb-6">
              {order.items?.map((item: any, idx: number) => (
                <div
                  key={item.id ?? idx}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors duration-300 hover:border-white/10"
                >
                  {item.product?.image && (
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-dark-700">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {item.product?.name || "Produto"}
                    </p>
                    <p className="text-xs text-dark-400">
                      {item.quantity}x R$ {Number(item.price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-white">
                    R$ {(Number(item.price) * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Subtotal</span>
                <span className="text-white">
                  R$ {Number(order.subtotal ?? 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Taxa de entrega</span>
                <span className="text-white">
                  R$ {Number(order.deliveryFee ?? 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="font-bold text-white">Total</span>
                <span className="text-xl font-black text-brand-400">
                  R$ {Number(order.total ?? 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm stagger-1">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-300 mb-2">
                Pagamento
              </h4>
              <p className="text-white font-bold">
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
              {order.changeFor && (
                <p className="text-sm text-dark-400 mt-1">
                  Troco para R$ {Number(order.changeFor).toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>

            <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm stagger-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-300 mb-2">
                Cliente
              </h4>
              <p className="text-white font-bold">
                {order.customerName || "Não informado"}
              </p>
              {order.customerPhone && (
                <p className="text-sm text-dark-400 mt-1">
                  {order.customerPhone}
                </p>
              )}
              {order.address && (
                <p className="text-sm text-dark-400 mt-1 line-clamp-2">
                  {order.address}
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-dark-500 flex items-center justify-center gap-1">
            <RotateCcw className="w-3 h-3 animate-spin" style={{ animationDuration: "4s" }} />
            Atualização automática a cada 10 segundos
          </p>
        </div>
      )}
    </div>
  )
}
