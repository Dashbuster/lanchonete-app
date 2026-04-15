"use client"

import Image from "next/image"
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/Button"

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { items, clearCart, removeItem, total, updateQuantity } = useCart()

  const subtotal = total()
  const deliveryFee = items.length ? 6.9 : 0
  const finalTotal = subtotal + deliveryFee

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-dark-900 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-200">
              Seu pedido
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">Carrinho</h2>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="rounded-xl border border-white/10 p-2 text-dark-200 transition hover:text-white"
                aria-label="Limpar carrinho"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-dark-200 transition hover:text-white"
              aria-label="Fechar carrinho"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.05]">
              <ShoppingBag className="h-9 w-9 text-brand-300" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-white">Carrinho vazio</h3>
            <p className="mt-3 text-sm leading-7 text-dark-200">
              Adicione hambúrgueres, porções e bebidas para seguir para o checkout.
            </p>
            <Button className="mt-6" onClick={onClose}>
              Voltar ao cardápio
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {items.map((item) => {
                const itemTotal =
                  (item.price +
                    item.addons.reduce((sum, addon) => sum + addon.price, 0)) *
                  item.quantity

                return (
                  <article
                    key={item.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/[0.05]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">
                            🍔
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="truncate text-base font-bold text-white">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-brand-200">
                              R$ {itemTotal.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="rounded-xl border border-white/10 p-2 text-dark-200 transition hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {item.addons.length > 0 && (
                          <p className="mt-2 text-xs leading-6 text-dark-200">
                            {item.addons.map((addon) => addon.name).join(", ")}
                          </p>
                        )}

                        {item.observations && (
                          <p className="mt-2 text-xs leading-6 text-dark-300">
                            {item.observations}
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="border-t border-white/10 bg-black/20 px-5 py-5">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-dark-200">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex items-center justify-between text-dark-200">
                  <span>Entrega estimada</span>
                  <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={() => {
                  onClose()
                  router.push("/checkout")
                }}
              >
                Ir para o checkout
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
