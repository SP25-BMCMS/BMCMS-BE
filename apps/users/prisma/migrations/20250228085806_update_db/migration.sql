-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('Inspector', 'Reviewer', 'Technician', 'Leader');

-- AlterTable
ALTER TABLE "UserDetails" ADD COLUMN     "staffRole" "StaffRole";
