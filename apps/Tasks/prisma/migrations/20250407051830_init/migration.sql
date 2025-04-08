/*
  Warnings:

  - You are about to drop the column `locationDetailId` on the `Inspection` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Inspection_locationDetailId_key";

-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "locationDetailId";
