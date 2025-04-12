-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_cycle_id_fkey";

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "cycle_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "MaintenanceCycle"("cycle_id") ON DELETE SET NULL ON UPDATE CASCADE;
