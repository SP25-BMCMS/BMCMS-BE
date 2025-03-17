/*
  Warnings:

  - The values [Staff,Manager,Admin] on the enum `PositionName` will be removed. If these variants are still used in the database, this will fail.
  - The values [Probation] on the enum `StaffStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `staffRole` on the `UserDetails` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WorkingPosition` table. All the data in the column will be lost.
  - Added the required column `area` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PositionName_new" AS ENUM ('Leader', 'Technician', 'Janitor');
ALTER TABLE "WorkingPosition" ALTER COLUMN "positionName" TYPE "PositionName_new" USING ("positionName"::text::"PositionName_new");
ALTER TYPE "PositionName" RENAME TO "PositionName_old";
ALTER TYPE "PositionName_new" RENAME TO "PositionName";
DROP TYPE "PositionName_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StaffStatus_new" AS ENUM ('Active', 'Inactive');
ALTER TABLE "UserDetails" ALTER COLUMN "staffStatus" TYPE "StaffStatus_new" USING ("staffStatus"::text::"StaffStatus_new");
ALTER TYPE "StaffStatus" RENAME TO "StaffStatus_old";
ALTER TYPE "StaffStatus_new" RENAME TO "StaffStatus";
DROP TYPE "StaffStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "area" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserDetails" DROP COLUMN "staffRole";

-- AlterTable
ALTER TABLE "WorkingPosition" DROP COLUMN "status";

-- DropEnum
DROP TYPE "PositionStatus";

-- DropEnum
DROP TYPE "StaffRole";
