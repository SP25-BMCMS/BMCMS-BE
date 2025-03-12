-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Specific');

-- CreateEnum
CREATE TYPE "ScheduleJobStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Cancel');

-- CreateTable
CREATE TABLE "Schedule" (
    "schedule_id" TEXT NOT NULL,
    "schedule_name" VARCHAR(100) NOT NULL,
    "schedule_type" "ScheduleType" NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "area_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "ScheduleJob" (
    "schedule_job_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "run_date" DATE NOT NULL,
    "status" "ScheduleJobStatus" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "building_id" INTEGER NOT NULL,

    CONSTRAINT "ScheduleJob_pkey" PRIMARY KEY ("schedule_job_id")
);

-- AddForeignKey
ALTER TABLE "ScheduleJob" ADD CONSTRAINT "ScheduleJob_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("schedule_id") ON DELETE RESTRICT ON UPDATE CASCADE;
