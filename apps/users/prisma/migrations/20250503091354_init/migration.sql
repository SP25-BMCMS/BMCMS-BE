/*
  Warnings:

  - The values [Maintenance_Technician] on the enum `PositionName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PositionName_new" AS ENUM ('Leader', 'Technician', 'Manager');
ALTER TABLE "WorkingPosition" ALTER COLUMN "positionName" TYPE "PositionName_new" USING ("positionName"::text::"PositionName_new");
ALTER TYPE "PositionName" RENAME TO "PositionName_old";
ALTER TYPE "PositionName_new" RENAME TO "PositionName";
DROP TYPE "PositionName_old";
COMMIT;
