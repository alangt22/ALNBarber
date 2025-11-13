-- AlterTable
ALTER TABLE "BarberShop" ADD COLUMN     "closeTime" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "openTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "workingDays" TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']::TEXT[];
