/*
  Warnings:

  - The values [Verified,Unverified,Fixed,Confirmed,Finished] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('Pending', 'InProgress', 'InFixing', 'Reviewing', 'Rejected', 'Completed');
ALTER TABLE "CrackReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CrackReport" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "ReportStatus_old";
ALTER TABLE "CrackReport" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;
