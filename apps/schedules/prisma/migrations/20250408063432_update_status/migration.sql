-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('InProgress', 'Completed', 'Cancel');

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "schedule_status" "ScheduleStatus" NOT NULL DEFAULT 'InProgress';
