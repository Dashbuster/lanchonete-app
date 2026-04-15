import type { ReactNode } from "react"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface CartAddon {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  addons: CartAddon[]
  observations?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId && JSON.stringify(i.addons) === JSON.stringify(item.addons) && i.observations === item.observations
          )
          if (existingIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
            }
            return { items: updatedItems }
          }
          return { items: [...state.items, item] }
        }),

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== cartItemId)
              : state.items.map((item) =>
                  item.id === cartItemId ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => {
          const addonsTotal = item.addons.reduce(
            (addonsSum, addon) => addonsSum + addon.price,
            0
          )

          return sum + (item.price + addonsTotal) * item.quantity
        }, 0),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "brasa-burgers-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export function useCart() {
  return useCartStore()
}

export function CartProvider({ children }: { children: ReactNode }) {
  return children
}
