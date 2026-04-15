"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  Package2,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"

interface ComparisonMetric {
  current: number
  previous: number
  diff: number
  percent: number
}

interface ReportData {
  period: {
    from: string
    to: string
  }
  previousPeriod: {
    from: string
    to: string
  }
  totalRevenue: number
  totalOrders: number
  totalClients: number
  totalProfit: number
  avgTicket: number
  profitMargin: number
  cancellationRate: number
  deliveredOrders: number
  cancelledOrders: number
  activeOrders: number
  deliveredRevenue: number
  cancelledRevenue: number
  deliveryRevenue: number
  comparisons: {
    revenue: ComparisonMetric
    profit: ComparisonMetric
    orders: ComparisonMetric
    avgTicket: ComparisonMetric
  }
  dailySales: { date: string; revenue: number; profit: number; orders: number }[]
  topProducts: {
    name: string
    quantity: number
    revenue: number
    profit: number
    image: string | null
  }[]
  paymentBreakdown: {
    method: string
    count: number
    revenue: number
    percentage: number
  }[]
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const numberFormatter = new Intl.NumberFormat("pt-BR")

function formatDateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR")
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function getDateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: "7d", label: "Ultimos 7 dias", from: () => getDateDaysAgo(6), to: () => new Date().toISOString().slice(0, 10) },
  { key: "15d", label: "15 dias", from: () => getDateDaysAgo(14), to: () => new Date().toISOString().slice(0, 10) },
  { key: "30d", label: "30 dias", from: () => getDateDaysAgo(29), to: () => new Date().toISOString().slice(0, 10) },
  {
    key: "month",
    label: "Mes atual",
    from: () => {
      const date = new Date()
      date.setDate(1)
      return date.toISOString().slice(0, 10)
    },
    to: () => new Date().toISOString().slice(0, 10),
  },
]

function ComparisonBadge({ metric }: { metric: ComparisonMetric }) {
  const positive = metric.diff >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        positive
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-rose-500/15 text-rose-300"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(Math.abs(metric.percent))}
    </span>
  )
}

export default function RelatoriosPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [dateFrom, setDateFrom] = useState(() => getDateDaysAgo(6))
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReport() {
      setLoading(true)

      try {
        const response = await fetch(`/api/reports/sales?from=${dateFrom}&to=${dateTo}`)

        if (response.ok) {
          setReport(await response.json())
        }
      } catch (error) {
        console.error("Erro ao carregar relatorio:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [dateFrom, dateTo])

  const summary = useMemo(() => {
    if (!report) {
      return []
    }

    return [
      {
        label: "Faturamento",
        value: currencyFormatter.format(report.totalRevenue),
        helper: `Periodo anterior: ${currencyFormatter.format(report.comparisons.revenue.previous)}`,
        icon: DollarSign,
        comparison: report.comparisons.revenue,
      },
      {
        label: "Lucro estimado",
        value: currencyFormatter.format(report.totalProfit),
        helper: `Margem atual: ${formatPercent(report.profitMargin)}`,
        icon: TrendingUp,
        comparison: report.comparisons.profit,
      },
      {
        label: "Pedidos validos",
        value: numberFormatter.format(report.totalOrders),
        helper: `${numberFormatter.format(report.cancelledOrders)} cancelados no periodo`,
        icon: ShoppingBag,
        comparison: report.comparisons.orders,
      },
      {
        label: "Ticket medio",
        value: currencyFormatter.format(report.avgTicket),
        helper: `Periodo anterior: ${currencyFormatter.format(report.comparisons.avgTicket.previous)}`,
        icon: Users,
        comparison: report.comparisons.avgTicket,
      },
    ]
  }, [report])

  const maxDailyRevenue = useMemo(() => {
    if (!report?.dailySales.length) {
      return 0
    }

    return Math.max(...report.dailySales.map((day) => day.revenue))
  }, [report])

  if (loading && !report) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-white">
        Carregando relatorio financeiro...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
          Financeiro gerencial
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Visao financeira para acompanhar a saude da lanchonete
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-dark-100">
          Compare o desempenho do periodo atual com o anterior, acompanhe margem,
          ticket medio, cancelamentos e entenda o que esta puxando o caixa.
        </p>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-dark-200">
            <CalendarDays className="h-4 w-4 text-brand-300" />
            Periodo do relatorio
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const isActive = dateFrom === preset.from() && dateTo === preset.to()
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setDateFrom(preset.from())
                    setDateTo(preset.to())
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "border border-white/10 bg-white/[0.04] text-dark-100 hover:bg-white/[0.08]"
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-dark-300">
                Data inicial
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-dark-300">
                Data final
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
          </div>
        </div>

        {report ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-dark-200">
            Periodo atual: {formatDateLabel(report.period.from)} ate {formatDateLabel(report.period.to)}
            {" • "}
            Comparacao: {formatDateLabel(report.previousPeriod.from)} ate {formatDateLabel(report.previousPeriod.to)}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15">
                <item.icon className="h-5 w-5 text-brand-300" />
              </div>
              <ComparisonBadge metric={item.comparison} />
            </div>
            <p className="mt-4 text-sm text-dark-200">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-dark-300">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Saude do periodo</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-brand-300" />
                <p className="text-sm font-bold text-white">Receita realizada</p>
              </div>
              <p className="mt-4 text-3xl font-black text-white">
                {currencyFormatter.format(report?.deliveredRevenue ?? 0)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-dark-300">
                {numberFormatter.format(report?.deliveredOrders ?? 0)} pedidos entregues
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-rose-300" />
                <p className="text-sm font-bold text-white">Receita perdida</p>
              </div>
              <p className="mt-4 text-3xl font-black text-white">
                {currencyFormatter.format(report?.cancelledRevenue ?? 0)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-dark-300">
                Taxa de cancelamento: {formatPercent(report?.cancellationRate ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm font-bold text-white">Pedidos em andamento</p>
              <p className="mt-4 text-3xl font-black text-white">
                {numberFormatter.format(report?.activeOrders ?? 0)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-dark-300">
                Pedidos ainda em operacao
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm font-bold text-white">Receita de entrega</p>
              <p className="mt-4 text-3xl font-black text-white">
                {currencyFormatter.format(report?.deliveryRevenue ?? 0)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-dark-300">
                Parcela da taxa de entrega no periodo
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Formas de pagamento</h2>
          <div className="mt-5 space-y-3">
            {report?.paymentBreakdown.length ? (
              report.paymentBreakdown.map((item) => (
                <div key={item.method} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">{item.method}</p>
                      <p className="mt-1 text-xs text-dark-300">{item.count} pedido(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{currencyFormatter.format(item.revenue)}</p>
                      <p className="mt-1 text-xs text-dark-300">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-dark-200">
                Nenhum pagamento registrado no periodo.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">Evolucao diaria</h2>
          <div className="mt-5 space-y-3">
            {report?.dailySales.length ? (
              report.dailySales.map((day) => {
                const width = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0

                return (
                  <div key={day.date} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-dark-300">Dia</p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-dark-300">Faturamento</p>
                          <p className="mt-1 text-sm font-bold text-white">{currencyFormatter.format(day.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-dark-300">Lucro</p>
                          <p className="mt-1 text-sm font-bold text-emerald-300">{currencyFormatter.format(day.profit)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-dark-300">Pedidos</p>
                          <p className="mt-1 text-sm font-bold text-white">{day.orders}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                        style={{ width: `${Math.max(width, 6)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-dark-200">
                Nenhum pedido encontrado no periodo selecionado.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black text-white">Clientes e ticket</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-sm text-dark-200">Clientes atendidos</p>
                <p className="mt-2 text-3xl font-black text-white">{numberFormatter.format(report?.totalClients ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-sm text-dark-200">Ticket medio atual</p>
                <p className="mt-2 text-3xl font-black text-brand-300">{currencyFormatter.format(report?.avgTicket ?? 0)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Package2 className="h-5 w-5 text-brand-300" />
              <h2 className="text-2xl font-black text-white">Produtos mais vendidos</h2>
            </div>
            <div className="mt-5 space-y-3">
              {report?.topProducts.length ? (
                report.topProducts.slice(0, 5).map((product, index) => (
                  <div key={`${product.name}-${index}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">{product.name}</p>
                        <p className="mt-1 text-xs text-dark-300">{numberFormatter.format(product.quantity)} unidades vendidas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{currencyFormatter.format(product.revenue)}</p>
                        <p className="mt-1 text-xs text-emerald-300">Lucro {currencyFormatter.format(product.profit)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-dark-200">
                  Nenhum produto vendido no periodo filtrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
