/*
  Warnings:

  - Made the column `cycle_id` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_cycle_id_fkey";

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "cycle_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "MaintenanceCycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
