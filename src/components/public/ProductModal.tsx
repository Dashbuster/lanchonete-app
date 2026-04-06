"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { X, Minus, Plus } from "lucide-react"
import toast from "react-hot-toast"
import type { CartItem as CartItemType } from "@/hooks/useCart"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"

interface Addon {
  id: string
  name: string
  price: number
  available: boolean
  groupId: string
  productId: string
}

interface AddonGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
}

interface ProductModalProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    image: string | null
    categoryId: string
    addons: Addon[]
  } | null
  addonGroups: AddonGroup[]
  open: boolean
  onClose: () => void
}

export function ProductModal({
  product,
  addonGroups,
  open,
  onClose,
}: ProductModalProps) {
  const { addItem } = useCart()

  const [quantity, setQuantity] = useState(1)
  const [observations, setObservations] = useState("")
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setObservations("")
      if (product) {
        const defaultSelected: Record<string, string[]> = {}
        addonGroups.forEach((group) => {
          defaultSelected[group.id] = []
        })
        setSelectedAddons(defaultSelected)
      }
    }
  }, [open, product, addonGroups])

  const productAddons = useMemo(() => {
    if (!product) return []
    return product.addons || []
  }, [product])

  const groupsForProduct = useMemo(() => {
    if (!product || !addonGroups.length) return []

    // If addons have groupId matching addon groups, use those
    // Otherwise, assume all addons are single group
    const addons = productAddons
    const groupIds = new Set(addons.map((a) => a.groupId))

    // Try to match addon groups to product via add-on group id relationship
    // Since Prisma doesn't enforce a product->group relation, we show all groups
    // but only show addons that belong to each group
    if (groupIds.size === 0) {
      // No groupId set, create a default single group
      return [
        {
          id: "default",
          name: "Complementos",
          minSelect: 0,
          maxSelect: 0,
          required: false,
          addons,
        },
      ]
    }

    const matchedGroups: AddonGroup[] = []
    const unmatchedAddons: Addon[] = []

    addons.forEach((addon) => {
      const matchedGroup = addonGroups.find((g) => g.id === addon.groupId)
      if (matchedGroup) {
        if (!matchedGroups.find((g) => g.id === matchedGroup.id)) {
          matchedGroups.push(matchedGroup)
        }
      } else {
        unmatchedAddons.push(addon)
      }
    })

    // If no groups matched but there are addons, create a default group
    if (matchedGroups.length === 0 && addons.length > 0) {
      return [
        {
          id: "default",
          name: "Complementos",
          minSelect: 0,
          maxSelect: 0,
          required: false,
          addons,
        },
      ]
    }

    // Attach addons to their groups
    return matchedGroups.map((group) => {
      const groupAddons = addons.filter((a) => a.groupId === group.id)
      return { ...group, addons: groupAddons }
    })
  }, [product, addonGroups, productAddons])

  const handleAddonToggle = (groupId: string, addonId: string) => {
    setSelectedAddons((prev) => {
      const current = prev[groupId] || []
      const group = groupsForProduct.find((g) => g.id === groupId)

      if (!group) return prev

      const alreadySelected = current.includes(addonId)

      if (alreadySelected) {
        if (group.minSelect <= current.length - 1) {
          return { ...prev, [groupId]: current.filter((id) => id !== addonId) }
        }
        return prev
      }

      if (group.maxSelect > 0 && current.length >= group.maxSelect) {
        return prev
      }

      return { ...prev, [groupId]: [...current, addonId] }
    })
  }

  const addonPrice = useMemo(() => {
    if (!product) return 0
    let total = 0
    Object.entries(selectedAddons).forEach(([groupId, addonIds]) => {
      addonIds.forEach((addonId) => {
        const addon = productAddons.find((a) => a.id === addonId)
        if (addon) total += Number(addon.price)
      })
    })
    return total
  }, [selectedAddons, productAddons, product])

  const itemTotal = useMemo(() => {
    if (!product) return 0
    const basePrice = Number(product.price)
    return (basePrice + addonPrice) * quantity
  }, [product, addonPrice, quantity])

  const selectedAddonList = useMemo(() => {
    const list: { name: string; price: number }[] = []
    Object.entries(selectedAddons).forEach(([, addonIds]) => {
      addonIds.forEach((addonId) => {
        const addon = productAddons.find((a) => a.id === addonId)
        if (addon) {
          list.push({ name: addon.name, price: Number(addon.price) })
        }
      })
    })
    return list
  }, [selectedAddons, productAddons])

  const handleAddToCart = () => {
    if (!product) return

    // Validate required groups
    for (const group of groupsForProduct) {
      const selected = selectedAddons[group.id] || []
      if (group.required && selected.length < group.minSelect) {
        toast.error(
          `Selecione pelo menos ${group.minSelect} opção(ões) em "${group.name}"`
        )
        return
      }
    }

    const cartItem: CartItemType = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || undefined,
      quantity,
      addons: selectedAddonList,
      observations: observations || undefined,
    }

    addItem(cartItem)
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho`)
    onClose()
  }

  if (!product || !open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg overflow-hidden rounded-t-2xl bg-dark-900 shadow-xl sm:rounded-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 border border-dark-600 sm:max-h-[90vh] flex flex-col">
        {/* Close button */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-dark-800/80 p-2 text-dark-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          <div className="relative aspect-video w-full overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                <span className="text-6xl">🍔</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product info */}
          <div>
            <h2 className="text-xl font-bold text-white">{product.name}</h2>
            {product.description && (
              <p className="mt-1 text-sm text-dark-300">{product.description}</p>
            )}
            <p className="mt-2 text-lg font-bold text-brand-500">
              R$ {Number(product.price).toFixed(2).replace(".", ",")}
            </p>
          </div>

          {/* Addon groups */}
          {groupsForProduct.map((group) => {
            const addonList = (group as any).addons || []
            if (!addonList.length) return null

            const isMulti = group.maxSelect > 1
            const current = selectedAddons[group.id] || []

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {group.name}
                  </h3>
                  {group.required && (
                    <span className="text-xs text-red-400 font-medium">
                      {group.minSelect > 1
                        ? `(${current.length}/${group.minSelect} min)`
                        : `(${group.minSelect} obrigatório)`}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {addonList.map((addon: Addon) => {
                    const isSelected = current.includes(addon.id)
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        disabled={!addon.available}
                        onClick={() => handleAddonToggle(group.id, addon.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                          isSelected
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-dark-600 bg-dark-800"
                        } ${
                          !addon.available
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-dark-500 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isMulti ? (
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-brand-500 bg-brand-500"
                                  : "border-dark-500"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`h-5 w-5 rounded-full border ${
                                isSelected
                                  ? "border-brand-500 bg-brand-500"
                                  : "border-dark-500"
                              }`}
                            >
                              {isSelected && (
                                <div className="h-full w-full flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-white">{addon.name}</span>
                        </div>
                        <span className="text-dark-300">
                          +R$ {Number(addon.price).toFixed(2).replace(".", ",")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-200">
              Observações
            </label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Alguma observação sobre o pedido?"
              maxLength={300}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark-600 p-4 space-y-3">
          <div className="flex items-center justify-between">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="rounded-lg bg-dark-700 p-2 text-dark-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-lg font-semibold text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="rounded-lg bg-dark-700 p-2 text-dark-300 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Total */}
            <span className="text-lg font-bold text-white">
              R$ {itemTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <Button onClick={handleAddToCart} className="w-full" size="lg">
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  )
}
