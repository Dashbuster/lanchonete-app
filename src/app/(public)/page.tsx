"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { Search, Clock, MapPin, Coffee, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { ProductCard } from "@/components/public/ProductCard"
import { ProductModal } from "@/components/public/ProductModal"

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  order: number
  active: boolean
}

interface Addon {
  id: string
  name: string
  price: number
  available: boolean
  groupId: string
  productId: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  categoryId: string
  available: boolean
  category: Category | null
  addons: Addon[]
}

interface AddonGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [storeOpen, setStoreOpen] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, productsRes, addonsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products?available=true"),
          fetch("/api/addon-groups"),
        ])

        if (catsRes.ok) {
          const data = await catsRes.json()
          setCategories(data)
        }

        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data)
        }

        if (addonsRes.ok) {
          const data = await addonsRes.json()
          setAddonGroups(data.groups || [])
        }

        // Check store open status
        try {
          const settingsRes = await fetch("/api/settings")
          if (settingsRes.ok) {
            const settings = await settingsRes.json()
            const isOpenSetting = settings.find((s: any) => s.key === "storeOpen")
            if (isOpenSetting) {
              setStoreOpen(isOpenSetting.value === "true")
            }
          }
        } catch {
          // default to open
        }
      } catch (err) {
        console.error("Error fetching menu data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = products

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [products, selectedCategory, searchQuery])

  const handleAddProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setModalOpen(true)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djRjMCAxLjEtLjkgMi0yIDJINHYtNGgyOHptNCAwdjRoMjR2LTRIMzd6bTctMTBoLTR2MjhoNHYtMjh6bTI0IDBoLTI0djRoMjRjMS4xIDAgMi0uOSAyLTJ2LTIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Lanchonete
                </h1>
                <p className="text-brand-100 text-sm sm:text-base mt-1">
                  Os melhores lanches da cidade, feitos com carinho
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-white text-sm">
                  Rua das Flores, 123
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-sm">
                  Seg-Dom, 10h-23h
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                  storeOpen
                    ? "bg-emerald-500 text-white"
                    : "bg-dark-900/80 text-dark-400"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    storeOpen ? "bg-white animate-pulse" : "bg-dark-400"
                  }`}
                />
                {storeOpen ? "Aberto" : "Fechado"}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-dark-900 to-transparent" />
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 -mt-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar no cardapio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 py-3 text-base bg-dark-800 border border-dark-600 shadow-xl rounded-lg text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
            >
              X
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory md:snap-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                : "bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600"
            }`}
          >
            Todos
          </button>
          {categories
            .filter((c) => c.active)
            .map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600"
                }`}
              >
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-dark-700" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-dark-700 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-dark-700 rounded w-full" />
                    <div className="h-3 bg-dark-700 rounded w-1/2" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 bg-dark-700 rounded w-20" />
                    <div className="h-9 bg-dark-700 rounded w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 mx-auto text-dark-600 mb-4" />
            <h3 className="text-xl font-semibold text-dark-300">
              Nenhum produto encontrado
            </h3>
            <p className="text-dark-400 mt-2">
              {searchQuery
                ? "Tente uma busca diferente"
                : "Nenhum produto nesta categoria"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={Number(product.price)}
                image={product.image}
                available={product.available}
                onAdd={() => handleAddProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
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
