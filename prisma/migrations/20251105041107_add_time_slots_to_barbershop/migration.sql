/*
  Warnings:

  - You are about to drop the column `closeTime` on the `BarberShop` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `BarberShop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BarberShop" DROP COLUMN "closeTime",
DROP COLUMN "openTime";
