import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string; // Product document ID
  cartItemId: string; // Unique ID for cart row (id + size + color)
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
  stock?: number;
  productCode?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
         const existing = state.items.find((i) => i.cartItemId === item.cartItemId);
         if (existing) {
           return { 
             items: state.items.map((i) => 
               i.cartItemId === item.cartItemId 
                 ? { ...i, quantity: i.quantity + item.quantity } 
                 : i
             ) 
           };
         }
         return { items: [...state.items, item] };
      }),
      updateQuantity: (cartItemId, delta) => set((state) => ({
        items: state.items.map((i) => {
          if (i.cartItemId === cartItemId) {
            const newQty = Math.max(1, i.quantity + delta);
            return { ...i, quantity: newQty };
          }
          return i;
        })
      })),
      removeItem: (cartItemId) => set((state) => ({ items: state.items.filter((i) => i.cartItemId !== cartItemId) })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'human-nature-cart',
    }
  )
);
