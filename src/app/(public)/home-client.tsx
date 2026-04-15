"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  Clock3,
  Flame,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react"
import { ProductCard } from "@/components/public/ProductCard"
import { ProductFilters } from "@/components/public/ProductFilters"
import { ProductModal } from "@/components/public/ProductModal"
import {
  CategoryPillSkeleton,
  ProductCardSkeleton,
} from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/Button"
import { Reveal } from "@/components/ui/Reveal"
import type { PublicSiteSettings } from "@/lib/public-settings"

function getHoursText(settings: PublicSiteSettings) {
  const openDays = Object.values(settings.dayHours).filter((day) => day.isOpen)
  if (!openDays.length) return "Consulte o horario da loja no atendimento."

  const uniqueRanges = Array.from(
    new Set(openDays.map((day) => `${day.open} as ${day.close}`))
  )

  if (uniqueRanges.length === 1) {
    return `Todos os dias: ${uniqueRanges[0]}.`
  }

  return `Horarios configurados no painel: ${uniqueRanges.join(" / ")}.`
}

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  order: number
  active: boolean
  _count?: {
    products: number
  }
}

interface Addon {
  id: string
  name: string
  price: number
  groupId: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  categoryId: string
  available: boolean
  prepTime?: number
  category: Category | null
  addons: Addon[]
}

interface AddonGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
  productId?: string | null
}

type HomeClientProps = {
  initialSettings: PublicSiteSettings
}

export function HomeClient({ initialSettings }: HomeClientProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [storeOpen] = useState(initialSettings.storeOpen)
  const [priceRange, setPriceRange] = useState<{
    min: number | null
    max: number | null
  }>({
    min: null,
    max: null,
  })
  const [sortBy, setSortBy] = useState<
    "popular" | "price_asc" | "price_desc" | "name"
  >("popular")

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesResponse, productsResponse, groupsResponse] =
          await Promise.all([
            fetch("/api/categories"),
            fetch("/api/products?available=true"),
            fetch("/api/addon-groups"),
          ])

        if (categoriesResponse.ok) {
          setCategories(await categoriesResponse.json())
        }

        if (productsResponse.ok) {
          setProducts(await productsResponse.json())
        }

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          setAddonGroups(groupsData.groups || [])
        }
      } catch (error) {
        console.error("Erro ao carregar cardapio:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory !== "all" && product.categoryId !== selectedCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = product.name.toLowerCase().includes(query)
        const matchesDescription = product.description
          ?.toLowerCase()
          .includes(query)

        if (!matchesName && !matchesDescription) {
          return false
        }
      }

      if (priceRange.min !== null && Number(product.price) < priceRange.min) {
        return false
      }

      if (priceRange.max !== null && Number(product.price) > priceRange.max) {
        return false
      }

      return true
    })
    .sort((left, right) => {
      if (sortBy === "price_asc") {
        return Number(left.price) - Number(right.price)
      }

      if (sortBy === "price_desc") {
        return Number(right.price) - Number(left.price)
      }

      if (sortBy === "name") {
        return left.name.localeCompare(right.name)
      }

      return Number(right.available) - Number(left.available)
    })

  const featuredProducts = products.slice(0, 3)
  const categoryCount = categories.filter((category) => category.active).length
  const regionNeighborhoods = initialSettings.neighborhoods.slice(0, 6)
  const neighborhoodsLabel = initialSettings.neighborhoods.length
    ? initialSettings.neighborhoods.join(", ")
    : "Consulte o atendimento para confirmar a cobertura."
  const hoursText = getHoursText(initialSettings)

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="section-shell pt-8 sm:pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Main Hero Card */}
          <div className="animate-fade-in-up relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(249,115,22,0.28),rgba(20,15,11,0.92)_55%,rgba(12,14,14,0.98))] p-6 shadow-[0_30px_80px_rgba(249,115,22,0.12),0_20px_60px_rgba(0,0,0,0.3)] sm:p-8">
            {/* Animated blur orbs */}
            <div className="pointer-events-none absolute -right-8 top-4 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl animate-gradient" />
            <div className="pointer-events-none absolute bottom-0 right-20 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl floating-accent" />
            <div className="pointer-events-none absolute left-10 top-1/2 h-24 w-24 rounded-full bg-orange-500/10 blur-3xl floating-accent" style={{ animationDelay: "2s" }} />

            <div className="relative flex flex-col gap-8">
              <div className="animate-fade-in-up inline-flex w-fit items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100 backdrop-blur-sm stagger-1">
                <Flame className="h-4 w-4 text-brand-300" />
                Feito com fogo & carinho
              </div>

              <div className="animate-fade-in-up max-w-2xl stagger-2">
                <h1
                  className="relative text-5xl font-black uppercase leading-none text-white sm:text-6xl lg:text-7xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  hamburguer
                  <br />
                  <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-amber-400 bg-clip-text text-transparent animate-gradient">
                    no ponto certo
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-dark-100 sm:text-base">
                  Monte combos, escolha extras, pague do seu jeito e acompanhe
                  seu pedido em uma experiencia rapida, moderna e pensada para
                  vender.
                </p>
              </div>

              <div className="animate-fade-in-up flex flex-col gap-3 sm:flex-row stagger-3">
                <Button
                  className="gap-2 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(249,115,22,0.3)] active:scale-[0.98]"
                  size="lg"
                  onClick={() => {
                    document
                      .getElementById("cardapio")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Ver cardapio
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-dark-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  PIX, dinheiro, debito, credito e pagamento no balcao
                </div>
              </div>

              <div className="animate-fade-in-up grid gap-3 sm:grid-cols-3 stagger-4">
                <div className="group glass-panel rounded-2xl p-4 transition-all duration-300 hover:border-brand-400/20 hover:bg-brand-500/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                    Tempo medio
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
                    <Clock3 className="h-5 w-5 text-brand-300 transition-transform duration-300 group-hover:rotate-12" />
                    25 a 35 min
                  </p>
                </div>
                <div className="group glass-panel rounded-2xl p-4 transition-all duration-300 hover:border-brand-400/20 hover:bg-brand-500/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                    Regiao
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
                    <MapPin className="h-5 w-5 text-brand-300 transition-transform duration-300 group-hover:-translate-y-1" />
                    {initialSettings.regionLabel}
                  </p>
                </div>
                <div className="group glass-panel rounded-2xl p-4 transition-all duration-300 hover:border-brand-400/20 hover:bg-brand-500/5">
                  <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                    Categorias
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
                    <Flame className="h-5 w-5 text-brand-300 transition-transform duration-300 group-hover:scale-110" />
                    {categoryCount} sessoes
                  </p>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-4 right-6 hidden sm:flex">
              <button
                onClick={() => {
                  document
                    .getElementById("cardapio")
                    ?.scrollIntoView({ behavior: "smooth" })
                }}
                className="scroll-indicator flex flex-col items-center gap-1 text-dark-300 transition-colors hover:text-brand-300"
                aria-label="Rolar para o cardapio"
              >
                <span className="text-[10px] uppercase tracking-[0.2em]">Ver mais</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Side Cards */}
          <div className="grid gap-4">
            <div className="animate-fade-in-up glass-panel rounded-[28px] p-5 stagger-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                    Area de atendimento
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {initialSettings.regionLabel}
                  </p>
                </div>
                <div className="relative h-4 w-4 rounded-full bg-emerald-400">
                  <div className="absolute inset-0 h-4 w-4 rounded-full bg-emerald-400 animate-ping opacity-30" />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-dark-200">
                {initialSettings.regionNotes ||
                  "Entrega ativa para os bairros cadastrados no painel."}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                  Base de entrega
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {initialSettings.regionCenter}
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up glass-panel rounded-[28px] p-5 stagger-2">
              <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                Mais pedidos
              </p>
              <div className="mt-4 space-y-3">
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-brand-400/20 hover:bg-brand-500/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-brand-100 transition-colors">
                        <span className="text-brand-300">{index + 1}.</span> {product.name}
                      </p>
                      <p className="text-xs text-dark-200">
                        R$ {Number(product.price).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <Star className="h-4 w-4 text-amber-300 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up glass-panel rounded-[28px] p-5 stagger-3">
              <p className="text-xs uppercase tracking-[0.24em] text-dark-200">
                Status da loja
              </p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-2xl font-bold text-white">
                  {storeOpen ? "Aberta agora" : "Fechada no momento"}
                </p>
                <div
                  className={`relative h-4 w-4 rounded-full ${
                    storeOpen ? "bg-emerald-400" : "bg-red-400"
                  }`}
                >
                  {storeOpen && (
                    <div className="absolute inset-0 h-4 w-4 rounded-full bg-emerald-400 animate-ping opacity-30" />
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-dark-200">
                {hoursText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="section-shell mt-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="animate-fade-in-up glass-panel rounded-[28px] px-5 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-300" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Procure por smash, combo, batata, molho, milk-shake..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm text-white placeholder:text-dark-300 outline-none transition-all duration-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:bg-black/30"
              />
            </div>
          </div>

          <div className="animate-fade-in-up relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-500/10 via-dark-900 to-dark-900 px-5 py-4 stagger-1">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <Truck className="h-5 w-5 flex-shrink-0 text-brand-300 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Entrega rapida</p>
                <p className="mt-2 leading-7 text-dark-100">
                  Checkout em poucos passos com resumo ao vivo e meios de pagamento
                  integrados a experiencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="section-shell mt-6">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`snap-start rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${
              selectedCategory === "all"
                ? "bg-brand-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] scale-[1.03]"
                : "border border-white/10 bg-white/[0.04] text-dark-100 hover:bg-white/[0.08] hover:border-white/15 hover:scale-[1.02]"
            }`}
          >
            Tudo
          </button>

          {loading ? (
            <>
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
            </>
          ) : (
            categories
              .filter((category) => category.active)
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`snap-start rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-brand-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] scale-[1.03]"
                      : "border border-white/10 bg-white/[0.04] text-dark-100 hover:bg-white/[0.08] hover:border-white/15 hover:scale-[1.02]"
                  }`}
                >
                  {category.name}
                </button>
              ))
          )}
        </div>
      </section>

      {/* Product Grid */}
      <section className="section-shell mt-6" id="cardapio">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-200">
              Cardapio
            </p>
            <h2
              className="mt-2 text-4xl font-black uppercase text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              escolha seu proximo pedido
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-7 text-dark-200 lg:block">
            Produtos com imagem forte, extras configuraveis e foco em decisao
            rapida.
          </p>
        </div>

        <ProductFilters
          products={products}
          onPriceRangeChange={(min, max) => setPriceRange({ min, max })}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="animate-fade-in glass-panel rounded-[28px] px-6 py-16 text-center">
            <p
              className="text-3xl font-black uppercase text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              nada encontrado
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-dark-200">
              Ajuste a busca ou limpe os filtros para ver novamente os itens do
              cardapio.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 60, 480)}ms` }}
              >
                <ProductCard
                  name={product.name}
                  description={product.description}
                  price={Number(product.price)}
                  image={product.image}
                  available={product.available}
                  onAdd={() => {
                    setSelectedProduct(product)
                    setModalOpen(true)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <ProductModal
        product={selectedProduct}
        addonGroups={addonGroups}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedProduct(null)
        }}
      />
    </div>
  )
}
