/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Apartment` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Apartment" DROP CONSTRAINT "Apartment_ownerId_fkey";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
