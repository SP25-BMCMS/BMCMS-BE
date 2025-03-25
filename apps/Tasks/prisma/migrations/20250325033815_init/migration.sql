/*
  Warnings:

  - Added the required column `status` to the `WorkLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkLogStatus" AS ENUM ('INIT_INSPECTION', 'WAIT_FOR_DEPOSIT', 'EXECUTE_CRACKS', 'CONFIRM_NO_PENDING_ISSUES', 'FINAL_REVIEW', 'CANCELLED');

-- AlterTable
ALTER TABLE "WorkLog" ADD COLUMN     "status" "WorkLogStatus" NOT NULL;
