"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Flame,
  Instagram,
  MapPin,
  Menu,
  Phone,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react"
import { CartDrawer } from "@/components/public/CartDrawer"
import { useCart } from "@/hooks/useCart"
import type { PublicSiteSettings } from "@/lib/public-settings"
import { cn } from "@/utils/cn"

function formatInstagramLabel(url: string) {
  const clean = url.trim()
  if (!clean) return "@instagram"

  const match = clean.match(/instagram\.com\/([^/?#]+)/i)
  if (match?.[1]) return `@${match[1]}`

  return clean.replace(/^https?:\/\//i, "").replace(/^www\./i, "")
}

function formatPhone(phone: string) {
  return phone.trim() || "Consulte o WhatsApp da loja"
}

function getHoursSummary(settings: PublicSiteSettings) {
  const openDays = Object.values(settings.dayHours).filter((day) => day.isOpen)
  if (!openDays.length) return "Consulte o horario da loja no atendimento."

  const uniqueRanges = Array.from(
    new Set(openDays.map((day) => `${day.open} as ${day.close}`))
  )

  if (uniqueRanges.length === 1) {
    return `Todos os dias: ${uniqueRanges[0]}`
  }

  return openDays
    .slice(0, 2)
    .map((day) => `${day.open} as ${day.close}`)
    .join(" / ")
}

export function PublicShell({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: PublicSiteSettings
}) {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const count = itemCount()
  const instagramLabel = useMemo(
    () => formatInstagramLabel(settings.instagramUrl),
    [settings.instagramUrl]
  )
  const hoursSummary = useMemo(() => getHoursSummary(settings), [settings])

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-900 text-white">
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-20" />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl transition-colors duration-300">
        <div className="section-shell flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-500 group-hover:shadow-[0_18px_50px_rgba(249,115,22,0.4)] group-hover:scale-105">
              {settings.storeLogo ? (
                <Image
                  src={settings.storeLogo}
                  alt={settings.storeName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Flame className="h-6 w-6 text-white transition-transform duration-500 group-hover:scale-110" />
              )}
            </div>
            <div>
              <p
                className="text-xl font-extrabold uppercase tracking-[0.18em] text-white transition-colors duration-300 group-hover:text-brand-100"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {settings.storeName}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-200">
                delivery e retirada
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              { href: "/", label: "Cardapio" },
              { href: "/checkout", label: "Checkout" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                  pathname === item.href
                    ? "bg-white/[0.08] text-white"
                    : "text-dark-200 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 lg:flex">
              <Sparkles className="h-4 w-4" />
              Pedidos em poucos cliques
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] transition-all duration-300 hover:border-brand-400/30 hover:bg-white/[0.12]"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="h-5 w-5 transition-colors duration-300 group-hover:text-brand-300" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white animate-scale-in shadow-[0_4px_12px_rgba(249,115,22,0.4)]">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] transition-all duration-300 hover:bg-white/[0.12] md:hidden"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="section-shell animate-fade-in-up pb-4 md:hidden">
            <div className="glass-panel rounded-3xl p-3">
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cardapio
                </Link>
                <Link
                  href="/checkout"
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Finalizar pedido
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="section-shell py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <p
                className="text-2xl font-extrabold uppercase tracking-[0.16em] text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {settings.storeName}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-dark-200">
                Confira o cardapio, monte seu pedido e acompanhe tudo em um fluxo
                rapido, ligado ao painel administrativo.
              </p>
            </div>

            <div className="space-y-3 text-sm text-dark-200">
              <p className="font-semibold text-white">Contato</p>
              <div className="flex items-center gap-2 group">
                <Phone className="h-4 w-4 text-brand-400 flex-shrink-0" />
                <span>{formatPhone(settings.whatsapp)}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-400 flex-shrink-0" />
                <span>{settings.regionCenter}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-dark-200">
              <p className="font-semibold text-white">Funcionamento</p>
              <p>{hoursSummary}</p>
              <p>{settings.storeOpen ? "Loja aberta agora" : "Loja fechada no momento"}</p>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-white transition-colors hover:text-brand-300"
              >
                <Instagram className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                <span className="relative">
                  {instagramLabel}
                  <span className="absolute -bottom-px left-0 h-px w-0 bg-brand-400 transition-all duration-300 group-hover:w-full" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} deliveryFee={settings.deliveryFee} />
    </div>
  )
}
