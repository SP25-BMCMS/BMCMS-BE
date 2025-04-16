-- CreateEnum
CREATE TYPE "reportStatus" AS ENUM ('NoPending', 'Pending', 'Approved', 'Rejected', 'AutoApproved');

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "confirmed_by" TEXT,
ADD COLUMN     "isprivateasset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_status" "reportStatus" NOT NULL DEFAULT 'NoPending';
