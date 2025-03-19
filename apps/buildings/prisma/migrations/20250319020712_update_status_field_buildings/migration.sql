-- CreateEnum
CREATE TYPE "BuildingStatus" AS ENUM ('under_construction', 'operational');

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "Status" "BuildingStatus";
