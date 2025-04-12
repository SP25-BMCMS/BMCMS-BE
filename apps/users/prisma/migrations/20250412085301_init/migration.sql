/*
  Warnings:

  - You are about to drop the column `warranty_date` on the `Apartment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "warranty_date",
ADD COLUMN     "warrantyDate" TEXT;
