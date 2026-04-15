"use client"

import { useMemo, useState } from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/utils/cn"

type SortOption = "popular" | "price_asc" | "price_desc" | "name"

interface ProductFiltersProps {
  products: Array<{
    id: string
    name: string
    price: number
  }>
  onPriceRangeChange: (min: number | null, max: number | null) => void
  onSortChange: (sort: SortOption) => void
}

export function ProductFilters({
  products,
  onPriceRangeChange,
  onSortChange,
}: ProductFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("popular")

  const limits = useMemo(() => {
    if (!products.length) {
      return { min: 0, max: 100 }
    }

    const prices = products.map((product) => Number(product.price))

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [products])

  const hasActiveFilters = Boolean(minPrice || maxPrice || sortBy !== "popular")

  function updateMinPrice(value: string) {
    setMinPrice(value)
    const min = value ? Number(value) : null
    if (min !== null && (!Number.isFinite(min) || min < 0)) return
    onPriceRangeChange(min, maxPrice && Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null)
  }

  function updateMaxPrice(value: string) {
    setMaxPrice(value)
    const max = value ? Number(value) : null
    if (max !== null && (!Number.isFinite(max) || max < 0)) return
    onPriceRangeChange(minPrice && Number.isFinite(Number(minPrice)) ? Number(minPrice) : null, max)
  }

  function updateSort(value: SortOption) {
    setSortBy(value)
    onSortChange(value)
  }

  function clearFilters() {
    setMinPrice("")
    setMaxPrice("")
    setSortBy("popular")
    onPriceRangeChange(null, null)
    onSortChange("popular")
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 lg:hidden"
      >
        <span className="flex items-center gap-3 text-sm font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-brand-300" />
          Filtros do cardápio
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-dark-200 transition",
            expanded && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "mt-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5",
          !expanded && "hidden lg:block"
        )}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-dark-200">
              Preço mínimo
            </p>
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              placeholder={`R$ ${limits.min}`}
              value={minPrice}
              onChange={(event) => updateMinPrice(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-dark-300 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-dark-200">
              Preço máximo
            </p>
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              placeholder={`R$ ${limits.max}`}
              value={maxPrice}
              onChange={(event) => updateMaxPrice(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-dark-300 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-dark-200">
              Ordenação
            </p>
            <select
              value={sortBy}
              onChange={(event) => updateSort(event.target.value as SortOption)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="popular">Mais pedidos</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-brand-300 transition hover:text-brand-200"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
