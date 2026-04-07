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
  unitPrice: number
  observations: string | null
  addons: { name: string; price: number }[]
}

interface OrderType {
  id: string
  number: number
  status: OrderStatus
  customerName: string
  customerPhone: string | null
  customerAddress: string | null
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
    label: "Entregue",
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
  [OrderStatus.DELIVERED]: "Entregues",
  [OrderStatus.CANCELLED]: "Cancelados",
}

// ─── Mock Data ──────────────────────────────────────────────────────

const mockOrders: OrderType[] = [
  {
    id: "1",
    number: 1042,
    status: OrderStatus.PENDING,
    customerName: "Joao Silva",
    customerPhone: "(11) 99999-1234",
    customerAddress: "Rua das Flores, 123",
    subtotal: 39.9,
    deliveryFee: 6.0,
    total: 45.9,
    paymentMethod: "PIX",
    items: [
      { id: "i1", product: { name: "X-Bacon", image: null }, quantity: 2, unitPrice: 18.5, observations: "Sem cebola", addons: [{ name: "Bacon extra", price: 3.0 }] },
      { id: "i2", product: { name: "Coca-Cola 350ml", image: null }, quantity: 1, unitPrice: 6.0, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T10:30:00Z",
  },
  {
    id: "2",
    number: 1041,
    status: OrderStatus.CONFIRMED,
    customerName: "Maria Santos",
    customerPhone: "(11) 98888-5678",
    customerAddress: "Av. Paulista, 456",
    subtotal: 28.5,
    deliveryFee: 4.0,
    total: 32.5,
    paymentMethod: "CREDIT_CARD",
    items: [
      { id: "i3", product: { name: "X-Salada", image: null }, quantity: 1, unitPrice: 15.5, observations: null, addons: [] },
      { id: "i4", product: { name: "Batata Frita P", image: null }, quantity: 1, unitPrice: 13.0, observations: "Bem crocante", addons: [] },
    ],
    createdAt: "2026-04-06T10:15:00Z",
  },
  {
    id: "3",
    number: 1040,
    status: OrderStatus.PREPARING,
    customerName: "Carlos Oliveira",
    customerPhone: "(11) 97777-9012",
    customerAddress: null,
    subtotal: 58.8,
    deliveryFee: 9.0,
    total: 67.8,
    paymentMethod: "PIX",
    items: [
      { id: "i5", product: { name: "X-Tudo", image: null }, quantity: 2, unitPrice: 22.0, observations: "Molho a parte", addons: [{ name: "Cheddar extra", price: 3.5 }, { name: "Bacon extra", price: 3.0 }] },
      { id: "i6", product: { name: "Milk Shake", image: null }, quantity: 1, unitPrice: 12.8, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T10:00:00Z",
  },
  {
    id: "4",
    number: 1039,
    status: OrderStatus.READY,
    customerName: "Ana Pereira",
    customerPhone: "(11) 96666-3456",
    customerAddress: "Rua Augusta, 789",
    subtotal: 22.9,
    deliveryFee: 6.0,
    total: 28.9,
    paymentMethod: "CASH",
    items: [
      { id: "i7", product: { name: "Cachorro Quente", image: null }, quantity: 1, unitPrice: 14.9, observations: null, addons: [] },
      { id: "i8", product: { name: "Guarana 350ml", image: null }, quantity: 1, unitPrice: 8.0, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T09:45:00Z",
  },
  {
    id: "5",
    number: 1038,
    status: OrderStatus.DELIVERED,
    customerName: "Pedro Costa",
    customerPhone: "(11) 95555-7890",
    customerAddress: "Rua Consolacao, 321",
    subtotal: 48.0,
    deliveryFee: 7.0,
    total: 55.0,
    paymentMethod: "DEBIT_CARD",
    items: [
      { id: "i9", product: { name: "Combo Familiar", image: null }, quantity: 1, unitPrice: 48.0, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T09:30:00Z",
  },
  {
    id: "6",
    number: 1037,
    status: OrderStatus.DELIVERED,
    customerName: "Lucia Ferreira",
    customerPhone: "(11) 94444-1234",
    customerAddress: "Rua Sao Bento, 654",
    subtotal: 35.2,
    deliveryFee: 6.0,
    total: 41.2,
    paymentMethod: "PIX",
    items: [
      { id: "i10", product: { name: "Acai 300ml", image: null }, quantity: 1, unitPrice: 22.0, observations: "Com granola e banana", addons: [{ name: "Leite em po", price: 2.0 }, { name: "Paçoca", price: 2.0 }] },
      { id: "i11", product: { name: "Suco Natural", image: null }, quantity: 1, unitPrice: 11.2, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T09:15:00Z",
  },
  {
    id: "7",
    number: 1036,
    status: OrderStatus.CANCELLED,
    customerName: "Roberto Lima",
    customerPhone: "(11) 93333-5678",
    customerAddress: "Rua Oscar Freire, 100",
    subtotal: 15.9,
    deliveryFee: 4.0,
    total: 19.9,
    paymentMethod: "CREDIT_CARD",
    items: [
      { id: "i12", product: { name: "Pastel de Carne", image: null }, quantity: 2, unitPrice: 7.95, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T09:00:00Z",
  },
  {
    id: "8",
    number: 1035,
    status: OrderStatus.DELIVERED,
    customerName: "Fernanda Souza",
    customerPhone: "(11) 92222-9012",
    customerAddress: "Rua Haddock Lobo, 200",
    subtotal: 65.5,
    deliveryFee: 8.0,
    total: 73.5,
    paymentMethod: "PIX",
    items: [
      { id: "i13", product: { name: "Pizza Broto", image: null }, quantity: 1, unitPrice: 35.0, observations: null, addons: [] },
      { id: "i14", product: { name: "Coca-Cola 2L", image: null }, quantity: 1, unitPrice: 12.5, observations: null, addons: [] },
      { id: "i15", product: { name: "Batata Frita G", image: null }, quantity: 1, unitPrice: 18.0, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T08:45:00Z",
  },
  {
    id: "9",
    number: 1034,
    status: OrderStatus.DELIVERED,
    customerName: "Marcos Almeida",
    customerPhone: "(11) 91111-3456",
    customerAddress: "Rua Bela Cintra, 500",
    subtotal: 31.7,
    deliveryFee: 5.0,
    total: 36.7,
    paymentMethod: "CASH",
    items: [
      { id: "i16", product: { name: "X-Frango", image: null }, quantity: 1, unitPrice: 17.5, observations: "Sem alface", addons: [] },
      { id: "i17", product: { name: "Suco de Laranja", image: null }, quantity: 1, unitPrice: 10.0, observations: null, addons: [] },
      { id: "i18", product: { name: "Torrada", image: null }, quantity: 1, unitPrice: 4.2, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T08:30:00Z",
  },
  {
    id: "10",
    number: 1033,
    status: OrderStatus.DELIVERED,
    customerName: "Patricia Rocha",
    customerPhone: "(11) 90000-7890",
    customerAddress: "Rua Pamplona, 150",
    subtotal: 46.4,
    deliveryFee: 6.0,
    total: 52.4,
    paymentMethod: "PIX",
    items: [
      { id: "i19", product: { name: "X-Picao", image: null }, quantity: 2, unitPrice: 20.0, observations: null, addons: [{ name: "Queijo extra", price: 3.2 }] },
      { id: "i20", product: { name: "Refrigerante Lata", image: null }, quantity: 2, unitPrice: 6.0, observations: null, addons: [] },
    ],
    createdAt: "2026-04-06T08:15:00Z",
  },
]

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

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const json = await res.json()
        setOrders(json)
      } else {
        setOrders(mockOrders)
      }
    } catch {
      setOrders(mockOrders)
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
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        fetchOrders()
      } else {
        // Update locally for mock
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        )
      }
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      )
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: OrderStatus.CANCELLED }),
      })
      if (res.ok) {
        fetchOrders()
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o))
        )
      }
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o))
      )
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
                      <TableCell className="font-medium text-white">#{order.number}</TableCell>
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
                                  {order.customerAddress || "Retirada no local"}
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
                                      {formatCurrency(item.unitPrice * item.quantity)}
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
