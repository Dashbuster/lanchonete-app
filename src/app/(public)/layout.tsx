"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, ShoppingBag, Clock, Phone, MapPin, Instagram, Facebook, Menu as MenuIcon, X as XIcon } from "lucide-react"
import { cn } from "@/utils/cn"
import { useCart } from "@/hooks/useCart"
import { CartDrawer } from "@/components/public/CartDrawer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const count = itemCount()

  const toggleCart = useCallback(() => {
    setCartOpen((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dark-600 bg-dark-800/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-500">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-brand-500 hidden sm:inline">Lanchonete</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-dark-300 hover:text-white hover:bg-dark-700"
                )}
              >
                Cardapio
              </Link>
              <Link
                href="/#meu-pedido"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/#meu-pedido" || pathname?.startsWith("/pedido")
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-dark-300 hover:text-white hover:bg-dark-700"
                )}
              >
                Meu Pedido
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-lg p-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                aria-label="Abrir carrinho"
                className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[0.65rem] font-bold shadow-lg">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t border-dark-600 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-dark-300 hover:text-white hover:bg-dark-700"
                )}
              >
                Cardapio
              </Link>
              <Link
                href="/#meu-pedido"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/#meu-pedido"
                    ? "bg-brand-500/10 text-brand-500"
                    : "text-dark-300 hover:text-white hover:bg-dark-700"
                )}
              >
                Meu Pedido
              </Link>
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-600 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-brand-500">Lanchonete</span>
              </div>
              <p className="text-sm text-dark-300 leading-relaxed">
                Os melhores lanches da cidade, feitos com carinho desde 2010.
              </p>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Endereco</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-dark-300">
                  <MapPin className="w-4 h-4 mt-0.5 text-brand-500 flex-shrink-0" />
                  <span>Rua das Flores, 123 - Centro</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>(11) 99999-1234</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Horario de Funcionamento</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <Clock className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>Seg a Sex: 10h - 23h</span>
                </div>
                <div className="text-sm text-dark-300 pl-6">
                  Sab e Dom: 11h - 00h
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Redes Sociais</h3>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-dark-700 text-dark-300 hover:text-brand-500 hover:bg-dark-600 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-dark-700 text-dark-300 hover:text-brand-500 hover:bg-dark-600 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-dark-600 text-center">
            <p className="text-xs text-dark-400">
              &copy; {new Date().getFullYear()} Lanchonete. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
