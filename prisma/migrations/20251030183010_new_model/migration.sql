/*
  Warnings:

  - Added the required column `userId` to the `BarberShop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BarberShop" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "BarberShop" ADD CONSTRAINT "BarberShop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
