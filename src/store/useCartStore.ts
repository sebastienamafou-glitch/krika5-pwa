// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PendingOrder = {
  id: string; 
  phone: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: number;
  customerId?: string; 
  // --- LES NOUVEAUX CHAMPS MANQUANTS SONT LÀ ---
  orderType?: 'TAKEAWAY' | 'DELIVERY'; 
  deliveryAddress?: string;            
};

interface CartStore {
  items: CartItem[];
  pendingOrders: PendingOrder[]; 
  
  customerId: string | null;
  setCustomer: (id: string | null) => void;

  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  
  enqueueOrder: (order: Omit<PendingOrder, 'id' | 'createdAt'>) => void;
  dequeueOrder: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      pendingOrders: [], 
      customerId: null,
      
      setCustomer: (id) => set({ customerId: id }),

      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },
      
      clearCart: () => set({ items: [], customerId: null }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      enqueueOrder: (orderData) => {
        const newOrder: PendingOrder = {
          ...orderData,
          id: `local-${Date.now()}`,
          createdAt: Date.now(),
        };
        set({ pendingOrders: [...get().pendingOrders, newOrder], customerId: null });
      },

      dequeueOrder: (id) => {
        set({
          pendingOrders: get().pendingOrders.filter((o) => o.id !== id),
        });
      },
    }),
    {
      name: 'krika5-cart-storage', 
    }
  )
);
