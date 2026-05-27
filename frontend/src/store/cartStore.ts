import { create } from 'zustand'
import { Product, CartItem } from '../api/types'

interface CartState {
  items: CartItem[]
  add: (product: Product, qty?: number) => void
  setQty: (productId: number, qty: number) => void
  remove: (productId: number) => void
  clear: () => void
  total: () => number
  subtotal: () => number
  vat: () => number
}

const VAT = 0.12

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  add: (product, qty = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        }
      }
      return { items: [...state.items, { product, quantity: qty }] }
    })
  },

  setQty: (productId, qty) => {
    if (qty <= 0) {
      get().remove(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      ),
    }))
  },

  remove: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

  clear: () => set({ items: [] }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  vat: () => get().subtotal() * VAT,

  total: () => get().subtotal() * (1 + VAT),
}))
