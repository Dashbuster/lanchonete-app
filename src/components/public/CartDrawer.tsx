"use client"

import { useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const router = useRouter()

  const deliveryFee = useMemo(() => 5.0, [])
  const subtotal = total()
  const finalTotal = subtotal + deliveryFee

  const handleCheckout = () => {
    if (items.length === 0) return
    onClose()
    router.push("/checkout")
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-80 bg-dark-800 border-l border-dark-600 shadow-2xl flex flex-col animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-white">Carrinho</h2>
            <span className="bg-brand-500/20 text-brand-500 text-xs font-semibold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCart}
              className="text-xs text-dark-400 hover:text-red-400 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag className="w-16 h-16 text-dark-600 mb-4" />
            <p className="text-dark-300 text-lg font-medium">
              Seu carrinho está vazio
            </p>
            <p className="text-dark-400 text-sm mt-2">
              Adicione itens do cardápio para começar
            </p>
            <Button
              onClick={onClose}
              variant="secondary"
              className="mt-6"
            >
              Ver Cardápio
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {items.map((item) => {
                const itemTotal =
                  (item.price +
                    item.addons.reduce((s, a) => s + a.price, 0)) *
                  item.quantity

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-dark-700 rounded-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-dark-800">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl">🍔</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-white truncate">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-dark-400 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {item.addons.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {item.addons.map((addon, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-dark-400"
                            >
                              + {addon.name} - R$ {addon.price.toFixed(2).replace(".", ",")}
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.observations && (
                        <p className="mt-1 text-xs text-dark-400 italic truncate">
                          {item.observations}
                        </p>
                      )}

                      {/* Quantity + Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="rounded-md bg-dark-600 p-1 text-dark-300 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium text-white w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="rounded-md bg-dark-600 p-1 text-dark-300 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-brand-500">
                          R$ {itemTotal.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-dark-600 px-4 py-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">Subtotal</span>
                  <span className="text-white font-medium">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-300">Taxa de entrega</span>
                  <span className="text-white font-medium">
                    R$ {deliveryFee.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-dark-600">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-brand-500">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
