-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'BARBER');

-- AlterTable
ALTER TABLE "BarberShop" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'BARBER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
