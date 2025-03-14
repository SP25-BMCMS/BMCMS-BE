/*
  Warnings:

  - The values [Reported,Completed,Rejected] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `CrackDetail` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('Pending', 'InProgress', 'Verified', 'Unverified', 'InFixing', 'Fixed', 'Confirmed', 'Finished');
ALTER TABLE "CrackReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CrackReport" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "ReportStatus_old";
ALTER TABLE "CrackReport" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- AlterTable
ALTER TABLE "CrackDetail" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "CrackReport" ALTER COLUMN "status" SET DEFAULT 'Pending';

-- DropEnum
DROP TYPE "CrackStatus";
