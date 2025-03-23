/*
  Warnings:

  - You are about to drop the column `areaType` on the `BuildingDetail` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `BuildingDetail` table. All the data in the column will be lost.
  - You are about to drop the column `floorNumber` on the `BuildingDetail` table. All the data in the column will be lost.
  - Added the required column `total_apartments` to the `BuildingDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BuildingDetail" DROP COLUMN "areaType",
DROP COLUMN "description",
DROP COLUMN "floorNumber",
ADD COLUMN     "total_apartments" INTEGER NOT NULL;
