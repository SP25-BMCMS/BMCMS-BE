-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Specific');

-- CreateEnum
CREATE TYPE "ScheduleJobStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Cancel');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('InProgress', 'Completed', 'Cancel');

-- CreateEnum
CREATE TYPE "MaintenanceBasis" AS ENUM ('ManufacturerRecommendation', 'LegalStandard', 'OperationalExperience', 'Other');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('Elevator', 'FireProtection', 'Electrical', 'Plumbing', 'HVAC', 'CCTV', 'Generator', 'Lighting', 'AutomaticDoor', 'FireExtinguisher', 'Other');

-- CreateTable
CREATE TABLE "MaintenanceCycle" (
    "cycle_id" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "basis" "MaintenanceBasis" NOT NULL DEFAULT 'OperationalExperience',
    "device_type" "DeviceType" NOT NULL DEFAULT 'Other',

    CONSTRAINT "MaintenanceCycle_pkey" PRIMARY KEY ("cycle_id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "schedule_id" TEXT NOT NULL,
    "schedule_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schedule_status" "ScheduleStatus" NOT NULL DEFAULT 'InProgress',
    "cycle_id" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "ScheduleJob" (
    "schedule_job_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "run_date" DATE NOT NULL,
    "status" "ScheduleJobStatus" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildingDetailId" TEXT,
    "inspection_id" TEXT,

    CONSTRAINT "ScheduleJob_pkey" PRIMARY KEY ("schedule_job_id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "MaintenanceCycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleJob" ADD CONSTRAINT "ScheduleJob_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("schedule_id") ON DELETE SET NULL ON UPDATE CASCADE;
