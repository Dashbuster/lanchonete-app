"use client"

import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { cn } from "@/utils/cn"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: { value: string; up: boolean }
}

interface Order {
  id: string
  number: number
  customerName: string
  status: string
  total: number
  createdAt: string
}

interface DashboardData {
  stats: {
    totalOrders: number
    revenue: number
    avgTicket: number
    pendingOrders: number
  }
  statsTrend: {
    totalOrders: { value: string; up: boolean }
    revenue: { value: string; up: boolean }
    avgTicket: { value: string; up: boolean }
    pendingOrders: { value: string; up: boolean }
  }
  recentOrders: Order[]
}

// ─── Mock Data ──────────────────────────────────────────────────────

const mockDashboardData: DashboardData = {
  stats: {
    totalOrders: 1248,
    revenue: 28750.5,
    avgTicket: 23.04,
    pendingOrders: 12,
  },
  statsTrend: {
    totalOrders: { value: "12%", up: true },
    revenue: { value: "8.2%", up: true },
    avgTicket: { value: "3.1%", up: false },
    pendingOrders: { value: "2", up: false },
  },
  recentOrders: [
    { id: "1", number: 1042, customerName: "Joao Silva", status: "PENDING", total: 45.9, createdAt: "2026-04-06T10:30:00Z" },
    { id: "2", number: 1041, customerName: "Maria Santos", status: "PREPARING", total: 32.5, createdAt: "2026-04-06T10:15:00Z" },
    { id: "3", number: 1040, customerName: "Carlos Oliveira", status: "READY", total: 67.8, createdAt: "2026-04-06T10:00:00Z" },
    { id: "4", number: 1039, customerName: "Ana Pereira", status: "DELIVERED", total: 28.9, createdAt: "2026-04-06T09:45:00Z" },
    { id: "5", number: 1038, customerName: "Pedro Costa", status: "CONFIRMED", total: 55.0, createdAt: "2026-04-06T09:30:00Z" },
    { id: "6", number: 1037, customerName: "Lucia Ferreira", status: "DELIVERED", total: 41.2, createdAt: "2026-04-06T09:15:00Z" },
    { id: "7", number: 1036, customerName: "Roberto Lima", status: "CANCELLED", total: 19.9, createdAt: "2026-04-06T09:00:00Z" },
    { id: "8", number: 1035, customerName: "Fernanda Souza", status: "DELIVERED", total: 73.5, createdAt: "2026-04-06T08:45:00Z" },
    { id: "9", number: 1034, customerName: "Marcos Almeida", status: "DELIVERED", total: 36.7, createdAt: "2026-04-06T08:30:00Z" },
    { id: "10", number: 1033, customerName: "Patricia Rocha", status: "DELIVERED", total: 52.4, createdAt: "2026-04-06T08:15:00Z" },
  ],
}

// ─── Components ─────────────────────────────────────────────────────

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 transition-colors hover:border-dark-500">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-300">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend.up ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn(trend.up ? "text-emerald-400" : "text-red-400")}>
                {trend.value} vs ontem
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dark-500">
          {icon}
        </div>
      </div>
    </div>
  )
}

function getStatusVariant(status: string): "warning" | "info" | "success" | "danger" | "default" {
  const map: Record<string, "warning" | "info" | "success" | "danger" | "default"> = {
    PENDING: "warning",
    CONFIRMED: "info",
    PREPARING: "warning",
    READY: "default",
    DELIVERED: "success",
    CANCELLED: "danger",
  }
  return map[status] || "default"
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    PREPARING: "Em Preparo",
    READY: "Pronto",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
  }
  return map[status] || status
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-dark-600 bg-dark-800 p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-4 w-20 rounded bg-dark-600" />
                <div className="h-7 w-28 rounded bg-dark-600" />
                <div className="h-3 w-24 rounded bg-dark-600" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-dark-600" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 animate-pulse">
        <div className="h-6 w-40 rounded bg-dark-600 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mt-4 h-10 rounded bg-dark-600" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setData(mockDashboardData)
      }
    } catch {
      setData(mockDashboardData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <DashboardSkeleton />
  }

  const stats = data?.stats ?? mockDashboardData.stats
  const trend = data?.statsTrend ?? mockDashboardData.statsTrend
  const orders = data?.recentOrders ?? mockDashboardData.recentOrders

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-dark-300 mt-1">Visao geral da sua lanchonete</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pedidos"
          value={stats.totalOrders.toLocaleString("pt-BR")}
          icon={<ShoppingCart className="w-6 h-6 text-brand-500" />}
          trend={trend.totalOrders}
        />
        <StatCard
          title="Receita"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
          trend={trend.revenue}
        />
        <StatCard
          title="Ticket Medio"
          value={formatCurrency(stats.avgTicket)}
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          trend={trend.avgTicket}
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats.pendingOrders.toString()}
          icon={<Clock className="w-6 h-6 text-yellow-500" />}
          trend={trend.pendingOrders}
        />
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-dark-600 bg-dark-800">
        <div className="px-6 py-4 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-white">Pedidos Recentes</h2>
          <p className="text-sm text-dark-300 mt-0.5">Ultimos 10 pedidos</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-white">#{order.number}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-white font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-dark-300">{formatDate(order.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
