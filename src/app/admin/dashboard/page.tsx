"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CircleDollarSign,
  FolderKanban,
  Package2,
  ShoppingBag,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react"

interface Product {
  id: string
  available: boolean
}

interface Category {
  id: string
  active: boolean
}

interface Order {
  id: string
  status: string
}

interface SalesReport {
  totalRevenue: number
  totalOrders: number
  totalClients: number
  totalProfit: number
  avgTicket: number
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

function getMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    from: start.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  }
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { from, to } = getMonthRange()

      try {
        const [productsResponse, categoriesResponse, ordersResponse, reportResponse] =
          await Promise.all([
            fetch("/api/products"),
            fetch("/api/categories"),
            fetch("/api/orders"),
            fetch(`/api/reports/sales?from=${from}&to=${to}`),
          ])

        if (productsResponse.ok) {
          setProducts(await productsResponse.json())
        }

        if (categoriesResponse.ok) {
          setCategories(await categoriesResponse.json())
        }

        if (ordersResponse.ok) {
          setOrders(await ordersResponse.json())
        }

        if (reportResponse.ok) {
          setReport(await reportResponse.json())
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const executiveStats = useMemo(() => {
    if (!report) {
      return []
    }

    return [
      {
        label: "Faturamento do mes",
        value: currencyFormatter.format(report.totalRevenue),
        helper: `${numberFormatter.format(report.totalOrders)} pedidos no periodo`,
        icon: CircleDollarSign,
      },
      {
        label: "Lucro estimado",
        value: currencyFormatter.format(report.totalProfit),
        helper: "Com base no custo dos itens vendidos",
        icon: TrendingUp,
      },
      {
        label: "Ticket medio",
        value: currencyFormatter.format(report.avgTicket),
        helper: "Valor medio por pedido valido",
        icon: Package2,
      },
      {
        label: "Clientes atendidos",
        value: numberFormatter.format(report.totalClients),
        helper: "Clientes unicos no periodo",
        icon: Users,
      },
    ]
  }, [report])

  const operationsStats = useMemo(() => {
    const availableProducts = products.filter((product) => product.available).length
    const activeCategories = categories.filter((category) => category.active).length
    const pendingOrders = orders.filter((order) =>
      ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(order.status)
    ).length

    return [
      {
        label: "Produtos ativos",
        value: numberFormatter.format(availableProducts),
        helper: `${numberFormatter.format(products.length)} cadastrados`,
        icon: FolderKanban,
      },
      {
        label: "Categorias ativas",
        value: numberFormatter.format(activeCategories),
        helper: `${numberFormatter.format(categories.length)} categorias no total`,
        icon: Tags,
      },
      {
        label: "Pedidos em andamento",
        value: numberFormatter.format(pendingOrders),
        helper: "Precisam de acompanhamento operacional",
        icon: ShoppingBag,
      },
    ]
  }, [categories, orders, products])

  const bestDay = useMemo(() => {
    if (!report?.dailySales.length) {
      return null
    }

    return [...report.dailySales].sort((left, right) => right.revenue - left.revenue)[0]
  }, [report])

  const topPaymentMethod = useMemo(() => {
    if (!report?.paymentBreakdown.length) {
      return null
    }

    return [...report.paymentBreakdown].sort((left, right) => right.revenue - left.revenue)[0]
  }, [report])

  const topProduct = report?.topProducts[0] ?? null

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(249,115,22,0.18),rgba(12,14,14,0.98)_55%)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
          Painel do proprietario
        </p>
        <h1 className="mt-3 text-4xl font-black text-white">
          Acompanhe vendas, lucro e operacao da lanchonete
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-dark-100">
          Aqui fica a leitura rapida do negocio: quanto entrou no mes, quanto sobrou,
          quantos clientes compraram e o que ainda exige acao no dia a dia.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/relatorios"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)]"
          >
            Ver relatorio financeiro
          </Link>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white"
          >
            Acompanhar pedidos
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading && executiveStats.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
                <div className="mt-4 h-4 w-28 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-10 w-36 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-3 w-40 animate-pulse rounded bg-white/10" />
              </div>
            ))
          : executiveStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15">
                  <item.icon className="h-5 w-5 text-brand-300" />
                </div>
                <p className="mt-4 text-sm text-dark-200">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-dark-300">
                  {item.helper}
                </p>
              </div>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
                Resumo do mes
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Leitura financeira para decidir rapido
              </h2>
            </div>
            <Link
              href="/admin/relatorios"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-300"
            >
              Abrir detalhamento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {report ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-dark-300">
                  Melhor dia em vendas
                </p>
                <p className="mt-3 text-lg font-black text-white">
                  {bestDay
                    ? new Date(`${bestDay.date}T12:00:00`).toLocaleDateString("pt-BR")
                    : "Sem dados"}
                </p>
                <p className="mt-2 text-sm text-emerald-300">
                  {bestDay ? currencyFormatter.format(bestDay.revenue) : "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-dark-300">
                  Forma de pagamento lider
                </p>
                <p className="mt-3 text-lg font-black text-white">
                  {topPaymentMethod ? topPaymentMethod.method : "Sem dados"}
                </p>
                <p className="mt-2 text-sm text-dark-200">
                  {topPaymentMethod
                    ? `${topPaymentMethod.percentage.toFixed(1)}% do faturamento`
                    : "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-dark-300">
                  Produto destaque
                </p>
                <p className="mt-3 text-lg font-black text-white">
                  {topProduct ? topProduct.name : "Sem dados"}
                </p>
                <p className="mt-2 text-sm text-dark-200">
                  {topProduct
                    ? `${numberFormatter.format(topProduct.quantity)} unidades vendidas`
                    : "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-dark-200">
              Os indicadores financeiros ainda nao foram carregados.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
            Operacao
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Itens que pedem acompanhamento
          </h2>

          <div className="mt-6 space-y-4">
            {operationsStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-dark-200">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-dark-300">
                      {item.helper}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06]">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
