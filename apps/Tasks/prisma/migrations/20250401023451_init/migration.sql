-- CreateTable
CREATE TABLE "Feedback" (
    "feedback_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "feedback_by" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;
