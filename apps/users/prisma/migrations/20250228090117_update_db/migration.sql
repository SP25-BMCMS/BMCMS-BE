/*
  Warnings:

  - The `status` column on the `UserDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('Active', 'Inactive', 'Probation');

-- AlterTable
ALTER TABLE "UserDetails" DROP COLUMN "status",
ADD COLUMN     "status" "StaffStatus";

-- DropEnum
DROP TYPE "EmploymentStatus";
