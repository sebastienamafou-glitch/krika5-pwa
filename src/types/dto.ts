// /src/types/dto.ts
import { OrderStatus, PaymentStatus, PaymentMethodType, ShiftStatus } from "@prisma/client";

// DTO pour l'affichage des produits dans le POS
export interface ProductDTO {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
  categoryId: string;
}

// DTO pour la session de caisse active
export interface ActiveShiftDTO {
  id: string;
  operatorId: string;
  operatorName: string; // Jointure requise dans l'action
  status: ShiftStatus;
  openingFloat: number;
  expectedCash: number;
  openedAt: Date;
}

// DTO pour le reçu (TicketReceipt)
export interface OrderReceiptDTO {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  createdAt: Date;
  operatorName: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// Type de retour standardisé pour les Server Actions
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
