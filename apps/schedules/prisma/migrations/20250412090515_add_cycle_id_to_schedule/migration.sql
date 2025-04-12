/*
  Warnings:

  - The `type` column on the `Device` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `basis` column on the `MaintenanceCycle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `schedule_type` on the `Schedule` table. All the data in the column will be lost.
  - Changed the type of `frequency` on the `MaintenanceCycle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `cycle_id` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Specific');

-- CreateEnum
CREATE TYPE "MaintenanceBasis" AS ENUM ('ManufacturerRecommendation', 'LegalStandard', 'OperationalExperience', 'Other');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('Elevator', 'FireProtection', 'Electrical', 'Plumbing', 'HVAC', 'CCTV', 'Generator', 'Lighting', 'AutomaticDoor', 'FireExtinguisher', 'Other');

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "type",
ADD COLUMN     "type" "DeviceType" NOT NULL DEFAULT 'Other';

-- AlterTable
ALTER TABLE "MaintenanceCycle" DROP COLUMN "frequency",
ADD COLUMN     "frequency" "Frequency" NOT NULL,
DROP COLUMN "basis",
ADD COLUMN     "basis" "MaintenanceBasis" NOT NULL DEFAULT 'OperationalExperience';

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "schedule_type",
ADD COLUMN     "cycle_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ScheduleType";

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "MaintenanceCycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
