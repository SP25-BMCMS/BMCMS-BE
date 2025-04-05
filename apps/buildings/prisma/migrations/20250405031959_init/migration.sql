/*
  Warnings:

  - You are about to drop the column `positionSide` on the `LocationDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LocationDetail" DROP COLUMN "positionSide";

-- DropEnum
DROP TYPE "PositionSide";
