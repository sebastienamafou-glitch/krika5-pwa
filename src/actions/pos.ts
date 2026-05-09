// /src/actions/pos.ts
"use server";

import { prisma } from "@/lib/prisma";
import { 
  openShiftSchema, 
  closeShiftSchema, 
  createPosOrderSchema,
  OpenShiftInput,
  CloseShiftInput,
  CreatePosOrderInput
} from "@/lib/validations/pos.schema";
import { ActionResponse, ActiveShiftDTO, OrderReceiptDTO } from "@/types/dto";
import { OrderStatus, PaymentStatus, PaymentMethodType, ShiftStatus } from "@prisma/client";

/**
 * 1. OUVRE UNE SESSION DE CAISSE
 */
export async function openShift(input: OpenShiftInput): Promise<ActionResponse<ActiveShiftDTO>> {
  try {
    const validatedData = openShiftSchema.parse(input);

    const existingShift = await prisma.cashShift.findFirst({
      where: {
        operatorId: validatedData.operatorId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingShift) {
      return { success: false, error: "Une session de caisse est déjà ouverte pour cet opérateur." };
    }

    const newShift = await prisma.cashShift.create({
      data: {
        operatorId: validatedData.operatorId,
        openingFloat: validatedData.openingFloat,
        expectedCash: validatedData.openingFloat, 
      },
      include: {
        operator: true,
      },
    });

    const shiftDTO: ActiveShiftDTO = {
      id: newShift.id,
      operatorId: newShift.operatorId,
      operatorName: newShift.operator.phone, 
      status: newShift.status,
      openingFloat: newShift.openingFloat,
      expectedCash: newShift.expectedCash,
      openedAt: newShift.openedAt,
    };

    return { success: true, data: shiftDTO };
  } catch {
    return { success: false, error: "Erreur lors de l'ouverture de la caisse." };
  }
}

/**
 * 2. FERME UNE SESSION DE CAISSE
 */
export async function closeShift(input: CloseShiftInput): Promise<ActionResponse> {
  try {
    const validatedData = closeShiftSchema.parse(input);

    const shift = await prisma.cashShift.findUnique({
      where: { id: validatedData.shiftId },
    });

    if (!shift || shift.status === ShiftStatus.CLOSED) {
      return { success: false, error: "Session de caisse introuvable ou déjà fermée." };
    }

    await prisma.cashShift.update({
      where: { id: validatedData.shiftId },
      data: {
        status: ShiftStatus.CLOSED,
        actualCash: validatedData.actualCash,
        closedAt: new Date(),
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la fermeture de la caisse." };
  }
}

/**
 * 3. CRÉATION DE COMMANDE & ENCAISSEMENT
 */
export async function createPosOrder(input: CreatePosOrderInput): Promise<ActionResponse<OrderReceiptDTO>> {
  try {
    const validatedData = createPosOrderSchema.parse(input);

    const orderReceipt = await prisma.$transaction(async (tx) => {
      const shift = await tx.cashShift.findUnique({
        where: { id: validatedData.shiftId },
      });

      if (!shift || shift.status === ShiftStatus.CLOSED) {
        throw new Error("La session de caisse est fermée.");
      }

      const order = await tx.order.create({
        data: {
          operatorId: validatedData.operatorId,
          shiftId: validatedData.shiftId,
          totalAmount: validatedData.totalAmount,
          paymentMethod: validatedData.paymentMethod as PaymentMethodType,
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.COMPLETED,
          orderType: validatedData.orderType,
          items: {
            create: validatedData.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          operator: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (validatedData.paymentMethod === PaymentMethodType.CASH) {
        await tx.cashShift.update({
          where: { id: validatedData.shiftId },
          data: {
            expectedCash: {
              increment: validatedData.totalAmount,
            },
          },
        });
      }

      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      const receipt: OrderReceiptDTO = {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        // CORRECTION TS18047 : Null-safety sur l'opérateur
        operatorName: order.operator?.phone ?? "Système",
        items: order.items.map((oi) => ({
          productName: oi.product.name,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
        })),
      };

      return receipt;
    });

    return { success: true, data: orderReceipt };
  } catch {
    return { success: false, error: "Transaction refusée." };
  }
}
