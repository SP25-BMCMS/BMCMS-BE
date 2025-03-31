/*
  Warnings:

  - You are about to drop the column `buildingDetailId` on the `CrackReport` table. All the data in the column will be lost.
  - Added the required column `buildingId` to the `CrackReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CrackReport" DROP COLUMN "buildingDetailId",
ADD COLUMN     "buildingId" TEXT NOT NULL;
