-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'CASHBOX';

-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "receiptUrl" TEXT;
