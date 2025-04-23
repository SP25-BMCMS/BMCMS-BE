-- CreateEnum
CREATE TYPE "CrackType" AS ENUM ('Vertical', 'Horizontal', 'Diagonal', 'Structural', 'NonStructural', 'Other');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('Elevator', 'FireProtection', 'Electrical', 'Plumbing', 'HVAC', 'CCTV', 'Generator', 'Lighting', 'AutomaticDoor', 'FireExtinguisher', 'Other');

-- CreateTable
CREATE TABLE "Device" (
    "device_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "DeviceType" NOT NULL DEFAULT 'Other',
    "manufacturer" VARCHAR(100),
    "model" VARCHAR(100),
    "buildingDetailId" TEXT NOT NULL,
    "contract_id" TEXT,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "contract_id" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "vendor" VARCHAR(255),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("contract_id")
);

-- CreateTable
CREATE TABLE "TechnicalRecord" (
    "record_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "upload_date" DATE NOT NULL,

    CONSTRAINT "TechnicalRecord_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "MaintenanceHistory" (
    "maintenance_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "date_performed" DATE NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(65,30),

    CONSTRAINT "MaintenanceHistory_pkey" PRIMARY KEY ("maintenance_id")
);

-- CreateTable
CREATE TABLE "CrackRecord" (
    "crackRecordId" TEXT NOT NULL,
    "locationDetailId" TEXT NOT NULL,
    "crackType" "CrackType" NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackRecord_pkey" PRIMARY KEY ("crackRecordId")
);

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_buildingDetailId_fkey" FOREIGN KEY ("buildingDetailId") REFERENCES "BuildingDetail"("buildingDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("contract_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalRecord" ADD CONSTRAINT "TechnicalRecord_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceHistory" ADD CONSTRAINT "MaintenanceHistory_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "Device"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackRecord" ADD CONSTRAINT "CrackRecord_locationDetailId_fkey" FOREIGN KEY ("locationDetailId") REFERENCES "LocationDetail"("locationDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;
