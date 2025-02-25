/*
  Warnings:

  - You are about to drop the `CrackRepairMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `aiDetectionUrl` to the `CrackDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Severity" ADD VALUE 'Unknown';

-- DropForeignKey
ALTER TABLE "CrackRepairMaterial" DROP CONSTRAINT "CrackRepairMaterial_crackDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "CrackRepairMaterial" DROP CONSTRAINT "CrackRepairMaterial_materialId_fkey";

-- AlterTable
ALTER TABLE "CrackDetail" ADD COLUMN     "aiDetectionUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "CrackRepairMaterial";

-- DropTable
DROP TABLE "Material";

-- CreateTable
CREATE TABLE "CrackSegment" (
    "crackSegmentId" TEXT NOT NULL,
    "crackDetailsId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackSegment_pkey" PRIMARY KEY ("crackSegmentId")
);

-- AddForeignKey
ALTER TABLE "CrackSegment" ADD CONSTRAINT "CrackSegment_crackDetailsId_fkey" FOREIGN KEY ("crackDetailsId") REFERENCES "CrackDetail"("crackDetailsId") ON DELETE RESTRICT ON UPDATE CASCADE;
