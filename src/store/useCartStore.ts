// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

// 1. Nouveau type pour les commandes en attente de synchronisation
export type PendingOrder = {
  id: string; // ID temporaire généré localement
  phone: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: number;
};

interface CartStore {
  items: CartItem[];
  pendingOrders: PendingOrder[]; // 2. La file d'attente hors-ligne
  
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  
  // 3. Actions pour gérer la file d'attente
  enqueueOrder: (order: Omit<PendingOrder, 'id' | 'createdAt'>) => void;
  dequeueOrder: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      pendingOrders: [], // Initialisation à vide
      
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
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      // --- LOGIQUE OFFLINE-FIRST ---

      // Met la commande en attente de réseau
      enqueueOrder: (orderData) => {
        const newOrder: PendingOrder = {
          ...orderData,
          id: `local-${Date.now()}`,
          createdAt: Date.now(),
        };
        set({ pendingOrders: [...get().pendingOrders, newOrder] });
      },

      // Supprime la commande de la file une fois qu'elle a été envoyée avec succès à Neon
      dequeueOrder: (id) => {
        set({
          pendingOrders: get().pendingOrders.filter((o) => o.id !== id),
        });
      },
    }),
    {
      name: 'krika5-cart-storage', // Les commandes en attente survivront au rafraîchissement de la page
    }
  )
);
