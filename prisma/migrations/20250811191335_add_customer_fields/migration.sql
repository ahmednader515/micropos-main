/*
  Warnings:

  - A unique constraint covering the columns `[customerNumber]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CustomerPriceTier" AS ENUM ('PRICE1', 'PRICE2', 'PRICE3');

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "buildingNumber" TEXT,
ADD COLUMN     "cardNumber" TEXT,
ADD COLUMN     "cardType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "commercialRegistration" TEXT,
ADD COLUMN     "creditLimit" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customerNumber" TEXT,
ADD COLUMN     "dueDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "priceTier" "public"."CustomerPriceTier" NOT NULL DEFAULT 'PRICE1',
ADD COLUMN     "streetName" TEXT,
ADD COLUMN     "taxRegistration" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerNumber_key" ON "public"."customers"("customerNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customers_barcode_key" ON "public"."customers"("barcode");
