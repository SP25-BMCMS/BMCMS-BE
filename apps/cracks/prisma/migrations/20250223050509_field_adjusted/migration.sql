/*
  Warnings:

  - You are about to drop the column `crackId` on the `CrackDetail` table. All the data in the column will be lost.
  - The primary key for the `CrackReport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `crackId` on the `CrackReport` table. All the data in the column will be lost.
  - Added the required column `crackReportId` to the `CrackDetail` table without a default value. This is not possible if the table is not empty.
  - The required column `crackReportId` was added to the `CrackReport` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "CrackDetail" DROP CONSTRAINT "CrackDetail_crackId_fkey";

-- AlterTable
ALTER TABLE "CrackDetail" DROP COLUMN "crackId",
ADD COLUMN     "crackReportId" TEXT NOT NULL,
ALTER COLUMN "reportedBy" SET DATA TYPE TEXT,
ALTER COLUMN "verifiedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CrackReport" DROP CONSTRAINT "CrackReport_pkey",
DROP COLUMN "crackId",
ADD COLUMN     "crackReportId" TEXT NOT NULL,
ALTER COLUMN "reportedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "CrackReport_pkey" PRIMARY KEY ("crackReportId");

-- AddForeignKey
ALTER TABLE "CrackDetail" ADD CONSTRAINT "CrackDetail_crackReportId_fkey" FOREIGN KEY ("crackReportId") REFERENCES "CrackReport"("crackReportId") ON DELETE RESTRICT ON UPDATE CASCADE;
