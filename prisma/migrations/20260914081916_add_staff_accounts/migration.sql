-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "name" TEXT,
ADD COLUMN     "staffOfId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_staffOfId_fkey" FOREIGN KEY ("staffOfId") REFERENCES "public"."Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
