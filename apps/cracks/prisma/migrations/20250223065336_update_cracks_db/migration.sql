/*
  Warnings:

  - The values [Description] on the enum `CrackStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `CrackDetail` table. All the data in the column will be lost.
  - You are about to drop the column `reportedBy` on the `CrackDetail` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `CrackDetail` table. All the data in the column will be lost.
  - Added the required column `description` to the `CrackReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verifiedBy` to the `CrackReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CrackStatus_new" AS ENUM ('InProgress', 'Verified', 'Completed');
ALTER TABLE "CrackDetail" ALTER COLUMN "status" TYPE "CrackStatus_new" USING ("status"::text::"CrackStatus_new");
ALTER TYPE "CrackStatus" RENAME TO "CrackStatus_old";
ALTER TYPE "CrackStatus_new" RENAME TO "CrackStatus";
DROP TYPE "CrackStatus_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'Rejected';

-- AlterTable
ALTER TABLE "CrackDetail" DROP COLUMN "description",
DROP COLUMN "reportedBy",
DROP COLUMN "verifiedBy",
ALTER COLUMN "status" SET DEFAULT 'InProgress',
ALTER COLUMN "severity" SET DEFAULT 'Unknown';

-- AlterTable
ALTER TABLE "CrackReport" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "verifiedBy" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Reported';
