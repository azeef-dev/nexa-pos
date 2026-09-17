/*
  Warnings:

  - A unique constraint covering the columns `[whatsappPhoneNumberId]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Provider" ADD COLUMN     "whatsappPhoneNumberId" TEXT;

-- CreateTable
CREATE TABLE "public"."WhatsAppSession" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "cart" JSONB NOT NULL DEFAULT '[]',
    "history" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_providerId_customerPhone_key" ON "public"."WhatsAppSession"("providerId", "customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_whatsappPhoneNumberId_key" ON "public"."Provider"("whatsappPhoneNumberId");

-- AddForeignKey
ALTER TABLE "public"."WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
