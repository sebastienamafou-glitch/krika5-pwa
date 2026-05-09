// /src/store/usePosStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ActiveShiftDTO, ProductDTO } from "@/types/dto";
import { CreatePosOrderInput } from "@/lib/validations/pos.schema";

// Extension du ProductDTO pour inclure la quantité gérée dans le panier
export interface CartItem extends ProductDTO {
  cartQuantity: number;
}

interface PosState {
  // 1. Gestion de la Session de Caisse (Zero Trust)
  activeShift: ActiveShiftDTO | null;
  setActiveShift: (shift: ActiveShiftDTO | null) => void;

  // 2. Gestion de la Fidélité / Client (Requis par CartSheet)
  customerId: string | null;
  setCustomer: (id: string | null) => void;

  // 3. Gestion du Panier (Opérations de caisse)
  cart: CartItem[];
  cartTotal: number; // Calculé dynamiquement pour éviter les recalculs côté composant
  addToCart: (product: ProductDTO) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // 4. Résilience Réseau (File d'attente Offline)
  syncQueue: CreatePosOrderInput[];
  enqueueOrder: (order: CreatePosOrderInput) => void;
  dequeueOrder: (index: number) => void;
}

// Fonction utilitaire pure pour le calcul du total en FCFA
const calculateTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + item.price * item.cartQuantity, 0);
};

export const usePosStore = create<PosState>()(
  // Le middleware 'persist' sauvegarde automatiquement le state dans le navigateur
  persist(
    (set, get) => ({
      // --- SHIFT ---
      activeShift: null,
      setActiveShift: (shift) => set({ activeShift: shift }),

      // --- CUSTOMER / FIDELITY ---
      customerId: null,
      setCustomer: (id) => set({ customerId: id }),

      // --- PANIER ---
      cart: [],
      cartTotal: 0,

      addToCart: (product) => {
        const { cart } = get();
        const existingItem = cart.find((item) => item.id === product.id);

        if (existingItem) {
          const updatedCart = cart.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
          set({ cart: updatedCart, cartTotal: calculateTotal(updatedCart) });
        } else {
          const updatedCart = [...cart, { ...product, cartQuantity: 1 }];
          set({ cart: updatedCart, cartTotal: calculateTotal(updatedCart) });
        }
      },

      removeFromCart: (productId) => {
        const updatedCart = get().cart.filter((item) => item.id !== productId);
        set({ cart: updatedCart, cartTotal: calculateTotal(updatedCart) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          const updatedCart = get().cart.filter((item) => item.id !== productId);
          set({ cart: updatedCart, cartTotal: calculateTotal(updatedCart) });
          return;
        }
        const updatedCart = get().cart.map((item) =>
          item.id === productId ? { ...item, cartQuantity: quantity } : item
        );
        set({ cart: updatedCart, cartTotal: calculateTotal(updatedCart) });
      },

      clearCart: () => set({ cart: [], cartTotal: 0, customerId: null }),

      // --- OFFLINE QUEUE ---
      syncQueue: [],
      enqueueOrder: (order) =>
        set((state) => ({ syncQueue: [...state.syncQueue, order] })),
      dequeueOrder: (index) =>
        set((state) => ({
          syncQueue: state.syncQueue.filter((_, i) => i !== index),
        })),
    }),
    {
      name: "krika5-pos-storage", // Nom de la clé dans le localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
