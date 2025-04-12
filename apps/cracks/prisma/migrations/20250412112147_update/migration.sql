/*
  Warnings:

  - You are about to drop the `CrackSegment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CrackSegment" DROP CONSTRAINT "CrackSegment_crackDetailsId_fkey";

-- DropTable
DROP TABLE "CrackSegment";
