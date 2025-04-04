-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "status" "MaterialStatus" NOT NULL DEFAULT 'ACTIVE';
