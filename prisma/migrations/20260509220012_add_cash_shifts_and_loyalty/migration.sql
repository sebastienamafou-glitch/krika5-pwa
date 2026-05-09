/*
  Warnings:

  - Changed the type of `paymentMethod` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'MOBILE_MONEY', 'CARD', 'CASH_DELIVERY');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "operatorId" TEXT,
ADD COLUMN     "shiftId" TEXT,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethodType" NOT NULL;

-- CreateTable
CREATE TABLE "CashShift" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openingFloat" INTEGER NOT NULL,
    "expectedCash" INTEGER NOT NULL DEFAULT 0,
    "actualCash" INTEGER,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CashShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashShift_operatorId_idx" ON "CashShift"("operatorId");

-- CreateIndex
CREATE INDEX "Order_operatorId_idx" ON "Order"("operatorId");

-- CreateIndex
CREATE INDEX "Order_shiftId_idx" ON "Order"("shiftId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashShift" ADD CONSTRAINT "CashShift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
