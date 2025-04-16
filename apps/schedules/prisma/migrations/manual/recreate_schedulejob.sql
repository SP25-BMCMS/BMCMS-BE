CREATE TABLE "ScheduleJob" (
  "schedule_job_id" TEXT NOT NULL,
  "schedule_id" TEXT NOT NULL,
  "start_date" DATE,
  "end_date" DATE,
  "run_date" DATE NOT NULL,
  "status" "ScheduleJobStatus" NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "buildingDetailId" TEXT NOT NULL,
  "inspection_id" TEXT,

  CONSTRAINT "ScheduleJob_pkey" PRIMARY KEY ("schedule_job_id"),
  CONSTRAINT "ScheduleJob_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "Schedule"("schedule_id") ON DELETE RESTRICT ON UPDATE CASCADE
); 