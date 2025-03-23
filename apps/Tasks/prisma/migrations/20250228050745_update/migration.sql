/*
  Warnings:

  - Added the required column `crack_id` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule_job_id` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "crack_id" INTEGER NOT NULL,
ADD COLUMN     "schedule_job_id" INTEGER NOT NULL;
