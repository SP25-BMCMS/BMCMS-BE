-- AlterTable
ALTER TABLE "MaintenanceCycle" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "MaintenanceCycleHistory" (
    "history_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "basis" "MaintenanceBasis" NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "changed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceCycleHistory_pkey" PRIMARY KEY ("history_id")
);

-- AddForeignKey
ALTER TABLE "MaintenanceCycleHistory" ADD CONSTRAINT "MaintenanceCycleHistory_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "MaintenanceCycle"("cycle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
