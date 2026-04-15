"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import toast from "react-hot-toast"
import type { CartItem } from "@/hooks/useCart"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"

interface Addon {
  id: string
  name: string
  price: number
  groupId: string
}

interface AddonGroup {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
  productId?: string | null
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
    if (!open || !product) {
      return
    }

    setQuantity(1)
    setObservations("")
    setSelectedAddons({})
  }, [open, product])

  const groupedAddons = useMemo(() => {
    if (!product) {
      return []
    }

    const productGroups = addonGroups.filter(
      (group) => !group.productId || group.productId === product.id
    )

    if (!productGroups.length && product.addons.length) {
      return [
        {
          id: "default",
          name: "Complementos",
          minSelect: 0,
          maxSelect: 0,
          required: false,
          addons: product.addons,
        },
      ]
    }

    return productGroups
      .map((group) => ({
        ...group,
        addons: product.addons.filter((addon) => addon.groupId === group.id),
      }))
      .filter((group) => group.addons.length > 0)
  }, [addonGroups, product])

  const addonsPrice = Object.values(selectedAddons).reduce((sum, currentGroup) => {
    return (
      sum +
      currentGroup.reduce((groupSum, addonId) => {
        const addon = product?.addons.find((item) => item.id === addonId)
        return groupSum + Number(addon?.price || 0)
      }, 0)
    )
  }, 0)

  const total = ((Number(product?.price || 0) + addonsPrice) * quantity).toFixed(2)

  function toggleAddon(groupId: string, addonId: string) {
    const group = groupedAddons.find((item) => item.id === groupId)

    if (!group) {
      return
    }

    setSelectedAddons((current) => {
      const currentSelection = current[groupId] || []
      const alreadySelected = currentSelection.includes(addonId)

      if (alreadySelected) {
        return {
          ...current,
          [groupId]: currentSelection.filter((id) => id !== addonId),
        }
      }

      if (group.maxSelect > 0 && currentSelection.length >= group.maxSelect) {
        toast.error(`Você pode escolher até ${group.maxSelect} item(ns) em ${group.name}.`)
        return current
      }

      return {
        ...current,
        [groupId]: [...currentSelection, addonId],
      }
    })
  }

  function handleAddToCart() {
    if (!product) {
      return
    }

    const missingRequiredGroup = groupedAddons.find((group) => {
      if (!group.required) {
        return false
      }

      return (selectedAddons[group.id] || []).length < group.minSelect
    })

    if (missingRequiredGroup) {
      toast.error(`Selecione os complementos obrigatórios em ${missingRequiredGroup.name}.`)
      return
    }

    const chosenAddons = Object.values(selectedAddons).flatMap((groupAddonIds) =>
      groupAddonIds
        .map((addonId) => product.addons.find((addon) => addon.id === addonId))
        .filter(Boolean)
        .map((addon) => ({
          id: addon!.id,
          name: addon!.name,
          price: Number(addon!.price),
        }))
    )

    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || undefined,
      quantity,
      addons: chosenAddons,
      observations: observations || undefined,
    }

    addItem(cartItem)
    toast.success("Item adicionado ao carrinho.")
    onClose()
  }

  if (!product || !open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md transition-opacity duration-300 sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="animate-scale-in relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-dark-900 shadow-[0_35px_90px_rgba(0,0,0,0.45)] sm:rounded-[32px]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid overflow-hidden lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[260px]">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.45),rgba(20,15,11,0.98))]">
                <span className="text-8xl">🍔</span>
              </div>
            )}
          </div>

          <div className="flex max-h-[92vh] flex-col">
            <div className="overflow-y-auto px-5 py-6 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
                Monte seu pedido
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">{product.name}</h2>
              <p className="mt-3 text-sm leading-7 text-dark-200">
                {product.description || "Personalize seu lanche com extras, molhos e observações."}
              </p>
              <p className="mt-4 text-3xl font-black text-brand-300">
                R$ {Number(product.price).toFixed(2).replace(".", ",")}
              </p>

              <div className="mt-8 space-y-6">
                {groupedAddons.map((group, gIdx) => (
                  <div key={group.id} className="animate-fade-in-up" style={{ animationDelay: `${120 + gIdx * 80}ms` }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-white">{group.name}</p>
                        <p className="text-xs text-dark-300">
                          {group.required
                            ? `Obrigatório: escolha ao menos ${group.minSelect}`
                            : "Opcional"}
                        </p>
                      </div>
                      {group.maxSelect > 0 && (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-dark-200">
                          até {group.maxSelect}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {group.addons.map((addon) => {
                        const isSelected = (selectedAddons[group.id] || []).includes(addon.id)

                        return (
                          <button
                            key={addon.id}
                            onClick={() => toggleAddon(group.id, addon.id)}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                              isSelected
                                ? "border-brand-500 bg-brand-500/10 shadow-[0_0_20px_rgba(249,115,22,0.08)]"
                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
                                  isSelected
                                    ? "border-brand-500 bg-brand-500 scale-110"
                                    : "border-dark-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-2 w-2 rounded-full bg-white animate-scale-in" />
                                )}
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {addon.name}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-brand-200">
                              + R$ {Number(addon.price).toFixed(2).replace(".", ",")}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div>
                  <p className="mb-3 text-base font-bold text-white">Observações</p>
                  <Textarea
                    placeholder="Ex.: sem cebola, ponto mais passado, enviar ketchup extra..."
                    value={observations}
                    onChange={(event) => setObservations(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((current) => current + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-dark-300">Total</p>
                  <p className="text-2xl font-black text-white">
                    R$ {total.replace(".", ",")}
                  </p>
                </div>
              </div>

              <Button className="mt-4 w-full" size="lg" onClick={handleAddToCart}>
                Adicionar ao carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
