-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "status" "FeedbackStatus" NOT NULL DEFAULT 'ACTIVE';
