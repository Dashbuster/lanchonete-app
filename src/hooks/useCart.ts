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
          // Normalize addon arrays by sorting for consistent comparison
          const normalizeAddons = (addons: CartAddon[]) =>
            [...addons].sort((a, b) => a.id.localeCompare(b.id))

          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              JSON.stringify(normalizeAddons(i.addons)) === JSON.stringify(normalizeAddons(item.addons)) &&
              i.observations === item.observations
          )
          if (existingIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
            }
            return { items: updatedItems }
          }
          // Deep-clone the item to prevent external mutation of store
          return { items: [...state.items, { ...item, addons: [...item.addons] }] }
        }),

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          // Guard against NaN, non-integer, and negative values
          if (!Number.isFinite(quantity) || quantity <= 0) {
            return {
              items: state.items.filter((item) => item.id !== cartItemId),
            }
          }
          return {
            items: state.items.map((item) =>
              item.id === cartItemId ? { ...item, quantity: Math.round(quantity) } : item
            ),
          }
        }),

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
      // Migrate old persisted cart state: remove items with missing/invalid fields
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { items?: unknown[] }
        if (!Array.isArray(state.items)) return { items: [] }
        return {
          items: state.items.filter((item) => {
            const i = item as Record<string, unknown>
            return (
              typeof i.id === "string" &&
              typeof i.productId === "string" &&
              typeof i.name === "string" &&
              typeof i.price === "number" &&
              Number.isFinite(i.price) &&
              typeof i.quantity === "number" &&
              Number.isFinite(i.quantity) &&
              Array.isArray(i.addons)
            )
          }),
        }
      },
    }
  )
)

export function useCart() {
  return useCartStore()
}

export function CartProvider({ children }: { children: ReactNode }) {
  return children
}
