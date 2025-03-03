/*
  Warnings:

  - The values [InCompleted,Cancel] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TaskAssignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WorkLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('Assigned', 'InProgress', 'Completed');
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_task_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_task_id_fkey";

-- DropForeignKey
ALTER TABLE "WorkLog" DROP CONSTRAINT "WorkLog_task_id_fkey";

-- AlterTable
ALTER TABLE "Inspection" ALTER COLUMN "task_assignment_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Task" DROP CONSTRAINT "Task_pkey",
ALTER COLUMN "task_id" DROP DEFAULT,
ALTER COLUMN "task_id" SET DATA TYPE TEXT,
ALTER COLUMN "crack_id" SET DATA TYPE TEXT,
ALTER COLUMN "schedule_job_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("task_id");
DROP SEQUENCE "Task_task_id_seq";

-- AlterTable
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_pkey",
ALTER COLUMN "assignment_id" DROP DEFAULT,
ALTER COLUMN "assignment_id" SET DATA TYPE TEXT,
ALTER COLUMN "task_id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("assignment_id");
DROP SEQUENCE "TaskAssignment_assignment_id_seq";

-- AlterTable
ALTER TABLE "WorkLog" DROP CONSTRAINT "WorkLog_pkey",
ALTER COLUMN "worklog_id" DROP DEFAULT,
ALTER COLUMN "worklog_id" SET DATA TYPE TEXT,
ALTER COLUMN "task_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("worklog_id");
DROP SEQUENCE "WorkLog_worklog_id_seq";

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_task_assignment_id_fkey" FOREIGN KEY ("task_assignment_id") REFERENCES "TaskAssignment"("assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
