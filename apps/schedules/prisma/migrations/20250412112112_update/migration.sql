/*
  Warnings:

  - The `device_type` column on the `MaintenanceCycle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `building_id` on the `ScheduleJob` table. All the data in the column will be lost.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaintenanceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicalRecord` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `buildingDetailId` to the `ScheduleJob` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_contract_id_fkey";

-- DropForeignKey
ALTER TABLE "MaintenanceHistory" DROP CONSTRAINT "MaintenanceHistory_device_id_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalRecord" DROP CONSTRAINT "TechnicalRecord_device_id_fkey";

-- AlterTable
ALTER TABLE "MaintenanceCycle" DROP COLUMN "device_type",
ADD COLUMN     "device_type" "DeviceType" NOT NULL DEFAULT 'Other';

-- AlterTable
ALTER TABLE "ScheduleJob" DROP COLUMN "building_id",
ADD COLUMN     "buildingDetailId" TEXT NOT NULL,
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "start_date" DATE;

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "Device";

-- DropTable
DROP TABLE "MaintenanceHistory";

-- DropTable
DROP TABLE "TechnicalRecord";
