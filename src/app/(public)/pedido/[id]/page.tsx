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
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pollId, setPollId] = useState<number | null>(null)

  const fetchOrder = useCallback(async () => {
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

    setPollId(id)
    return () => {
      clearInterval(id)
    }
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Acompanhamento do Pedido
            </h1>
            <p className="text-dark-400 mt-1">
              Pedido realizado em {order?.createdAt ? formatDate(order.createdAt) : ""}
            </p>
          </div>
          <button
            onClick={fetchOrder}
            className="rounded-lg p-2 text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cancelled State */}
      {isCancelled && (
        <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-400">
            Pedido Cancelado
          </h2>
          <p className="text-dark-300 mt-2">
            Entre em contato para mais informações
          </p>
        </div>
      )}

      {/* Delivered State */}
      {isComplete && (
        <div className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-emerald-400">
            Pedido Entregue!
          </h2>
          <p className="text-dark-300 mt-2">
            Obrigado pela preferência. Bom apetite!
          </p>
        </div>
      )}

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="mb-8 rounded-xl border border-dark-600 bg-dark-800 p-6">
          <h3 className="text-base font-semibold text-white mb-6">
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
                  className="flex items-start gap-4 relative"
                >
                  {/* Timeline line */}
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${
                        isPast
                          ? "bg-emerald-500"
                          : index === currentStepIndex
                            ? "bg-dark-600"
                            : "bg-dark-600"
                      }`}
                    />
                  )}

                  {/* Icon dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-colors ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-brand-500 text-white animate-pulse"
                          : "bg-dark-700 text-dark-400 border border-dark-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 pb-8">
                    <p
                      className={`font-medium ${
                        isPast
                          ? "text-emerald-400"
                          : isActive
                            ? "text-brand-500"
                            : "text-dark-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isPast && (
                      <p className="text-xs text-dark-400 mt-0.5">
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
        <div className="space-y-6">
          <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
            <h3 className="text-base font-semibold text-white mb-4">
              Detalhes do Pedido
            </h3>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {order.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-3 border-b border-dark-600 last:border-0"
                >
                  {item.product?.image && (
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-dark-700">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {item.product?.name || "Produto"}
                    </p>
                    <p className="text-xs text-dark-400">
                      {item.quantity}x R$ {Number(item.price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-white">
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
                  R$ {Number(order.subtotal).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Taxa de entrega</span>
                <span className="text-white">
                  R$ {Number(order.deliveryFee).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-dark-600">
                <span className="font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-brand-500">
                  R$ {Number(order.total).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">
                Pagamento
              </h4>
              <p className="text-white font-medium">
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
              {order.changeFor && (
                <p className="text-sm text-dark-400 mt-1">
                  Troco para R$ {Number(order.changeFor).toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
              <h4 className="text-sm font-medium text-dark-300 mb-2">
                Cliente
              </h4>
              <p className="text-white font-medium">
                {order.customerName || "Não informado"}
              </p>
              {order.customerPhone && (
                <p className="text-sm text-dark-400 mt-1">
                  {order.customerPhone}
                </p>
              )}
              {order.address && (
                <p className="text-sm text-dark-400 mt-1">
                  {order.address}
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-dark-500 flex items-center justify-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Atualização automática a cada 10 segundos
          </p>
        </div>
      )}
    </div>
  )
}
