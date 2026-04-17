"use client"

import { Fragment, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { cn } from "@/utils/cn"
import { OrderStatus } from "@/types"
import {
  ChevronDown,
  ChevronUp,
  Search,
  Package,
  RefreshCw,
  Clock,
  Check,
  Flame,
  Truck,
  X,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  product: { name: string; image: string | null }
  quantity: number
  price: number
  addons: { id: string; name: string; price: number }[]
  observations?: string
}

interface OrderType {
  id: string
  status: OrderStatus
  customerName: string | null
  customerPhone: string | null
  address: string | null
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  items: OrderItem[]
  createdAt: string
}

type OrderFilter = "ALL" | OrderStatus

type StatusStep = {
  status: OrderStatus
  label: string
  icon: React.ReactNode
  color: "default" | "success" | "danger" | "warning" | "info"
}

// ─── Constants ──────────────────────────────────────────────────────

const STATUS_STEPS: Record<OrderStatus, StatusStep> = {
  [OrderStatus.PENDING]: {
    status: OrderStatus.PENDING,
    label: "Pendente",
    icon: <Clock className="w-4 h-4" />,
    color: "warning",
  },
  [OrderStatus.CONFIRMED]: {
    status: OrderStatus.CONFIRMED,
    label: "Confirmado",
    icon: <Check className="w-4 h-4" />,
    color: "info",
  },
  [OrderStatus.PREPARING]: {
    status: OrderStatus.PREPARING,
    label: "Em Preparo",
    icon: <Flame className="w-4 h-4" />,
    color: "warning",
  },
  [OrderStatus.READY]: {
    status: OrderStatus.READY,
    label: "Pronto",
    icon: <Package className="w-4 h-4" />,
    color: "default",
  },
  [OrderStatus.DELIVERED]: {
    status: OrderStatus.DELIVERED,
    label: "Saiu para entrega",
    icon: <Truck className="w-4 h-4" />,
    color: "success",
  },
  [OrderStatus.CANCELLED]: {
    status: OrderStatus.CANCELLED,
    label: "Cancelado",
    icon: <X className="w-4 h-4" />,
    color: "danger",
  },
}

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
]

const FILTER_LABELS: Record<OrderFilter, string> = {
  ALL: "Todos",
  [OrderStatus.PENDING]: "Pendentes",
  [OrderStatus.CONFIRMED]: "Confirmados",
  [OrderStatus.PREPARING]: "Em Preparo",
  [OrderStatus.READY]: "Prontos",
  [OrderStatus.DELIVERED]: "Saiu para entrega",
  [OrderStatus.CANCELLED]: "Cancelados",
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

// ─── Skeleton ───────────────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-dark-600" />
        ))}
      </div>
      <div className="rounded-xl border border-dark-600 bg-dark-800 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-dark-600 last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderFilter>("ALL")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setRequestError(null)
      const res = await fetch("/api/orders")
      if (res.ok) {
        const json = await res.json()
        setOrders(json)
      } else {
        throw new Error("Nao foi possivel carregar os pedidos.")
      }
    } catch {
      setOrders([])
      setRequestError("Erro ao carregar pedidos do banco.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    // Poll every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter)

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const idx = STATUS_ORDER.indexOf(currentStatus)
    if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
      return STATUS_ORDER[idx + 1]
    }
    return null
  }

  const handleAdvanceStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus)
    if (!nextStatus) return

    setUpdating(orderId)
    setRequestError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        fetchOrders()
      } else {
        throw new Error("Nao foi possivel atualizar o pedido.")
      }
    } catch {
      setRequestError("Erro ao atualizar pedido. Nenhuma alteracao foi persistida.")
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setUpdating(orderId)
    setRequestError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: OrderStatus.CANCELLED }),
      })
      if (res.ok) {
        fetchOrders()
      } else {
        throw new Error("Nao foi possivel cancelar o pedido.")
      }
    } catch {
      setRequestError("Erro ao cancelar pedido. Nenhuma alteracao foi persistida.")
    } finally {
      setUpdating(null)
    }
  }

  const isTerminal = (status: OrderStatus) =>
    status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED

  if (loading) {
    return <OrdersSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-dark-300 mt-1">Gerencie todos os pedidos da lanchonete</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {requestError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {requestError}
        </div>
      )}

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...Object.values(OrderStatus)] as OrderFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-brand-500 text-white"
                : "bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white"
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-dark-300">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id)
                const nextStatus = getNextStatus(order.status)
                const nextStep = nextStatus ? STATUS_STEPS[nextStatus] : null
                const isUpdating = updating === order.id
                const isTerm = isTerminal(order.status)

                return (
                  <Fragment key={order.id}>
                    <TableRow>
                      <TableCell>
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="text-dark-300 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-white">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-sm">{order.customerName}</p>
                          {order.customerPhone && (
                            <p className="text-xs text-dark-300">{order.customerPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_STEPS[order.status].color}>
                          {STATUS_STEPS[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-dark-300 text-sm">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isTerm && nextStep && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={isUpdating}
                              onClick={() => handleAdvanceStatus(order.id, order.status)}
                              className="gap-1"
                            >
                              {nextStep.icon}
                              {nextStep.label}
                            </Button>
                          )}
                          {order.status !== OrderStatus.CANCELLED && !isTerm && (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isUpdating}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-dark-700/30 p-0">
                          <div className="p-4 space-y-4">
                            {/* Order Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-dark-400 uppercase tracking-wide">Endereco</p>
                                <p className="text-sm text-white mt-1">
                                  {order.address || "Retirada no local"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-400 uppercase tracking-wide">Pagamento</p>
                                <p className="text-sm text-white mt-1">{order.paymentMethod}</p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-400 uppercase tracking-wide">Subtotal</p>
                                <p className="text-sm text-white mt-1">{formatCurrency(order.subtotal)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-400 uppercase tracking-wide">Taxa de Entrega</p>
                                <p className="text-sm text-white mt-1">{formatCurrency(order.deliveryFee)}</p>
                              </div>
                            </div>

                            {/* Items */}
                            <div>
                              <h4 className="text-sm font-medium text-white mb-2">Itens do Pedido</h4>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-3 rounded-lg border border-dark-600 bg-dark-800 p-3"
                                  >
                                    <span className="flex items-center justify-center w-8 h-8 rounded bg-brand-500/20 text-brand-500 text-sm font-bold flex-shrink-0">
                                      {item.quantity}x
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-white">
                                        {item.product.name}
                                      </p>
                                      {item.observations && (
                                        <p className="text-xs text-dark-300 mt-0.5 italic">
                                          Obs: {item.observations}
                                        </p>
                                      )}
                                      {item.addons.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.addons.map((addon, aIdx) => (
                                            <Badge key={aIdx} variant="info" className="text-xs">
                                              + {addon.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-sm text-white font-medium flex-shrink-0">
                                      {formatCurrency(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-end">
                              <div className="text-right">
                                <p className="text-sm text-dark-300">Total do pedido</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(order.total)}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
