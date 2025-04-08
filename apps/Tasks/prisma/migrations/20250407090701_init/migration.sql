/*
  Warnings:

  - You are about to drop the column `remaining_quantity` on the `RepairMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RepairMaterial` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RepairMaterial" DROP COLUMN "remaining_quantity",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "RepairStatus";
