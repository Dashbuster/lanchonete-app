import { create } from "zustand"

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  addons: { name: string; price: number }[]
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

const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item: CartItem) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (cartItemId: string) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== cartItemId),
    })),

  updateQuantity: (cartItemId: string, quantity: number) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== cartItemId)
          : state.items.map((i) =>
              i.id === cartItemId ? { ...i, quantity } : i
            ),
    })),

  clearCart: () => set({ items: [] }),

  total: () =>
    get().items.reduce(
      (sum, item) =>
        sum +
        (item.price + item.addons.reduce((a, d) => a + d.price, 0)) *
          item.quantity,
      0
    ),

  itemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}))

export function useCart() {
  return useCartStore()
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  return children
}
