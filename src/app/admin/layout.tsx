"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Tags,
  Package,
  Settings,
  BarChart3,
  LogOut,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/utils/cn"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/cardapio", label: "Cardapio", icon: BookOpen },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/configuracoes", label: "Configuracoes", icon: Settings },
  { href: "/admin/relatorios", label: "Relatorios", icon: BarChart3 },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    router.push("/api/auth/signout")
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-dark-600 bg-dark-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-600">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Lanchonete</h1>
            <p className="text-xs text-dark-300">Painel Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-dark-300 hover:text-white hover:bg-dark-700"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="px-3 py-4 border-t border-dark-600">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-500 text-sm font-bold text-white">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-dark-300 truncate">admin@lanchonete.com</p>
            </div>
            <ChevronDown className="w-4 h-4 text-dark-300" />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-dark-300 hover:text-red-400 hover:bg-dark-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
