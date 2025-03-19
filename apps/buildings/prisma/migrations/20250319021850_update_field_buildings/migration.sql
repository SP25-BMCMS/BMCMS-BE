/*
  Warnings:

  - Added the required column `completion_date` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Added the required column `construction_date` to the `Building` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BuildingStatus" ADD VALUE 'completion_date';

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "completion_date" TEXT NOT NULL,
ADD COLUMN     "construction_date" TEXT NOT NULL;
