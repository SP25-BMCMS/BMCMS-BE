-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('Pending', 'Completed');

-- AlterTable
ALTER TABLE "RepairMaterial" ADD COLUMN     "remaining_quantity" INTEGER,
ADD COLUMN     "status" "RepairStatus" NOT NULL DEFAULT 'Pending';
