"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  LayoutDashboard,
  MoonStar,
  Package2,
  Settings,
  ShoppingBag,
  Tags,
} from "lucide-react"
import { cn } from "@/utils/cn"

const navItems = [
  { href: "/admin/dashboard", label: "Visao geral", icon: LayoutDashboard },
  { href: "/admin/relatorios", label: "Relatorios", icon: BarChart3 },
  { href: "/admin/produtos", label: "Produtos", icon: Package2 },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/configuracoes", label: "Configuracoes", icon: Settings },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#120d09,#0c0e0e_45%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-black/20 p-5 lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-[0_18px_40px_rgba(249,115,22,0.28)]">
                <MoonStar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-black uppercase tracking-[0.18em] text-white">
                  Big Night
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-200">
                  painel admin
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                Controle rapido
              </p>
              <p className="mt-2 text-sm leading-7 text-dark-100">
                Acompanhe o financeiro, ajuste o cardapio e controle os pedidos em um
                unico painel.
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + "/")

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-brand-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.24)]"
                        : "text-dark-100 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
