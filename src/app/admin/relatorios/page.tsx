"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────

interface ReportData {
  totalRevenue: number
  totalOrders: number
  avgTicket: number
  dailySales: { date: string; revenue: number; orders: number }[]
  topProducts: { name: string; quantity: number; revenue: number; image: string | null }[]
  paymentBreakdown: { method: string; count: number; revenue: number; percentage: number }[]
}

// ─── Mock Data ──────────────────────────────────────────────────────

const mockReportData: ReportData = {
  totalRevenue: 28750.50,
  totalOrders: 1248,
  avgTicket: 23.04,
  dailySales: [
    { date: "2026-03-31", revenue: 3200.0, orders: 135 },
    { date: "2026-04-01", revenue: 4100.0, orders: 178 },
    { date: "2026-04-02", revenue: 3800.0, orders: 162 },
    { date: "2026-04-03", revenue: 5200.0, orders: 220 },
    { date: "2026-04-04", revenue: 4800.0, orders: 205 },
    { date: "2026-04-05", revenue: 5100.5, orders: 218 },
    { date: "2026-04-06", revenue: 2550.0, orders: 130 },
  ],
  topProducts: [
    { name: "X-Bacon", quantity: 245, revenue: 4630.5, image: null },
    { name: "X-Salada", quantity: 198, revenue: 3069.0, image: null },
    { name: "X-Tudo", quantity: 175, revenue: 4200.0, image: null },
    { name: "Coca-Cola 350ml", quantity: 320, revenue: 1920.0, image: null },
    { name: "Batata Frita P", quantity: 210, revenue: 2730.0, image: null },
    { name: "Batata Frita G", quantity: 95, revenue: 1710.0, image: null },
    { name: "Acai 300ml", quantity: 88, revenue: 1936.0, image: null },
    { name: "Milk Shake", quantity: 120, revenue: 1536.0, image: null },
    { name: "Cachorro Quente", quantity: 75, revenue: 1117.5, image: null },
    { name: "Pastel de Carne", quantity: 65, revenue: 516.75, image: null },
  ],
  paymentBreakdown: [
    { method: "PIX", count: 520, revenue: 14800.0, percentage: 51.5 },
    { method: "Cartao de Credito", count: 310, revenue: 7500.0, percentage: 24.8 },
    { method: "Cartao de Debito", count: 180, revenue: 3800.0, percentage: 13.6 },
    { method: "Dinheiro", count: 238, revenue: 2650.5, percentage: 10.1 },
  ],
}

// ─── Chart Colors ───────────────────────────────────────────────────

const BAR_COLOR = "#F97316"
const PIE_COLORS = ["#F97316", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]

// ─── Custom Tooltip for Bar Chart ───────────────────────────────────

function CustomBarTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload?.[0]?.payload as { date: string; revenue: number; orders: number } | undefined
  if (!data) return null
  return (
    <div className="rounded-lg border border-dark-600 bg-dark-700 p-3 shadow-lg">
      <p className="text-sm font-medium text-white">
        {new Date(data.date + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })}
      </p>
      <p className="text-sm text-brand-500">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.revenue)}
      </p>
      <p className="text-xs text-dark-300">{data.orders} pedidos</p>
    </div>
  )
}

// ─── Custom Tooltip for Pie Chart ───────────────────────────────────

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload?.[0]?.payload as { method: string; revenue: number } | undefined
  if (!data) return null
  return (
    <div className="rounded-lg border border-dark-600 bg-dark-700 p-3 shadow-lg">
      <p className="text-sm font-medium text-white">{data.method}</p>
      <p className="text-sm text-brand-500">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.revenue)}
      </p>
    </div>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 animate-pulse">
        <div className="h-10 w-40 rounded bg-dark-600" />
        <div className="h-10 w-40 rounded bg-dark-600" />
        <div className="h-10 w-32 rounded bg-dark-600" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-dark-600 animate-pulse" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-dark-600 animate-pulse" />
      <div className="h-80 rounded-xl bg-dark-600 animate-pulse" />
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("2026-03-31")
  const [dateTo, setDateTo] = useState("2026-04-06")

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/reports?from=${dateFrom}&to=${dateTo}`
      )
      if (res.ok) {
        const json = await res.json()
        setReportData(json)
      } else {
        setReportData(mockReportData)
      }
    } catch {
      setReportData(mockReportData)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pt-BR").format(value)

  if (loading || !reportData) {
    return <ReportsSkeleton />
  }

  // Prepare bar chart data with formatted date
  const barChartData = reportData.dailySales.map((d) => ({
    ...d,
    dateLabel: new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatorios</h1>
          <p className="text-sm text-dark-300 mt-1">Analise e relatorios de vendas</p>
        </div>
        <Button variant="secondary" size="md" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Date Range Picker */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-300">Periodo:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <label htmlFor="date-from" className="block text-xs text-dark-400 mb-1">De</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
              }}
              className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <span className="text-dark-400 mt-4">ate</span>
          <div>
            <label htmlFor="date-to" className="block text-xs text-dark-400 mb-1">Ate</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
              }}
              className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="mt-5">
            <button
              onClick={fetchReport}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Filtrar
            </button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">Receita Total</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(reportData.totalRevenue)}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Receita no periodo</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dark-500">
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">Total de Pedidos</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatNumber(reportData.totalOrders)}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Pedidos no periodo</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dark-500">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-dark-300">Ticket Medio</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(reportData.avgTicket)}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-brand-500">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Venda media por pedido</span>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dark-500">
              <TrendingUp className="w-6 h-6 text-brand-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Sales Bar Chart */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Vendas Diarias</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#7C888A", fontSize: 12 }}
                axisLine={{ stroke: "#252B2D" }}
                tickLine={{ stroke: "#252B2D" }}
              />
              <YAxis
                tick={{ fill: "#7C888A", fontSize: 12 }}
                axisLine={{ stroke: "#252B2D" }}
                tickLine={{ stroke: "#252B2D" }}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="revenue" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Top Products + Payment Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Most Sold Products */}
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Produtos Mais Vendidos</h2>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topProducts.map((product, idx) => (
                  <TableRow key={product.name}>
                    <TableCell>
                      <Badge variant={idx === 0 ? "warning" : idx === 1 ? "info" : "default"}>
                        {idx + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">{product.name}</TableCell>
                    <TableCell className="text-right text-white">{product.quantity}</TableCell>
                    <TableCell className="text-right text-white">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Formas de Pagamento</h2>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.paymentBreakdown.map((d) => ({
                      name: d.method,
                      value: d.revenue,
                      ...d,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {reportData.paymentBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full lg:w-1/2 space-y-3">
              {reportData.paymentBreakdown.map((pm, idx) => (
                <div key={pm.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-white">{pm.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white font-medium">{formatCurrency(pm.revenue)}</p>
                    <p className="text-xs text-dark-300">
                      {pm.percentage}% ({pm.count} pedidos)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
