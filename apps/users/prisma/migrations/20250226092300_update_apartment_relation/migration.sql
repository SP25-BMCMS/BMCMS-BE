/*
  Warnings:

  - You are about to drop the column `apartmentNumber` on the `UserDetails` table. All the data in the column will be lost.
  - You are about to drop the column `buildingId` on the `UserDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserDetails" DROP COLUMN "apartmentNumber",
DROP COLUMN "buildingId";

-- CreateTable
CREATE TABLE "Apartment" (
    "apartmentId" TEXT NOT NULL,
    "apartmentName" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("apartmentId")
);

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserDetails"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
