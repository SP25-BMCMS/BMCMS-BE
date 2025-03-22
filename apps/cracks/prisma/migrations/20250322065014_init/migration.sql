/*
  Warnings:

  - Added the required column `isPrivatesAsset` to the `CrackReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `CrackReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CrackReport" ADD COLUMN     "isPrivatesAsset" BOOLEAN NOT NULL,
ADD COLUMN     "position" TEXT NOT NULL;
