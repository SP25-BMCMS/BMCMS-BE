/*
  Warnings:

  - You are about to drop the column `task_id` on the `RepairMaterial` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locationDetailId]` on the table `Inspection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `locationDetailId` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_cost` to the `Inspection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('Notyetverify', 'Verify', 'UnConfirm', 'Confirm', 'Completed', 'Other');

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "locationDetailId" TEXT NOT NULL,
ADD COLUMN     "status" "InspectionStatus" NOT NULL,
ADD COLUMN     "total_cost" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "RepairMaterial" DROP COLUMN "task_id";

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_locationDetailId_key" ON "Inspection"("locationDetailId");
