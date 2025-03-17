/*
  Warnings:

  - The values [pending,inprogress,reassigned,completed,notcompleted] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [InProgress] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `crack_id` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `inspection_date` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Inspection` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('Verified', 'Unverified', 'InFixing', 'Fixed', 'Confirmed', 'Reassigned');
ALTER TABLE "TaskAssignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "AssignmentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('Assigned', 'Completed');
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;

-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "crack_id",
DROP COLUMN "inspection_date",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "InspectionStatus";
