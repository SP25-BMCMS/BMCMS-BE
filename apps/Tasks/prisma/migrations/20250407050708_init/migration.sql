/*
  Warnings:

  - You are about to drop the column `status` on the `Inspection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "status";

-- DropEnum
DROP TYPE "InspectionStatus";
