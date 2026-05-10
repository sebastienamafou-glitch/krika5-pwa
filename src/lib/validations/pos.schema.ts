// src/lib/validations/pos.schema.ts
import { z } from "zod";

// --- VALIDATION DES SESSIONS DE CAISSE (SHIFTS) ---

export const openShiftSchema = z.object({
  operatorId: z.string().cuid({ message: "ID Opérateur invalide" }),
  openingFloat: z.number().int().min(0, { message: "Le fond de caisse ne peut pas être négatif" }),
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;

export const closeShiftSchema = z.object({
  shiftId: z.string().cuid(),
  actualCash: z.number().int().min(0, { message: "Le montant compté est invalide" }),
});

export type CloseShiftInput = z.infer<typeof closeShiftSchema>;

// --- VALIDATION DES ENCAISSEMENTS ---

const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(), // FCFA
});

export const createPosOrderSchema = z.object({
  operatorId: z.string().cuid(),
  shiftId: z.string().cuid(),
  totalAmount: z.number().int().positive(),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "CARD"]),
  orderType: z.enum(["TAKEAWAY", "DELIVERY"]),
  
  // 👉 TYPAGE STRICT DES NOUVEAUX CHAMPS (Zéro "any" toléré)
  userId: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  deliveryLat: z.number().optional().nullable(),
  deliveryLng: z.number().optional().nullable(),

  items: z.array(orderItemSchema).min(1, { message: "La commande ne peut pas être vide" }),
});

export type CreatePosOrderInput = z.infer<typeof createPosOrderSchema>;
