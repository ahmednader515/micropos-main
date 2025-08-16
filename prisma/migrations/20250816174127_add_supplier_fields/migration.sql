/*
  Warnings:

  - A unique constraint covering the columns `[supplierNumber]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."suppliers" ADD COLUMN     "commercialRegistration" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "supplierNumber" TEXT,
ADD COLUMN     "taxRegistration" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplierNumber_key" ON "public"."suppliers"("supplierNumber");
