/*
  Warnings:

  - Changed the type of `areaType` on the `LocationDetail` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AreaDetailsType" AS ENUM ('Floor', 'Wall', 'Ceiling', 'column', 'Other');

-- AlterTable
ALTER TABLE "LocationDetail" DROP COLUMN "areaType",
ADD COLUMN     "areaType" "AreaDetailsType" NOT NULL;
