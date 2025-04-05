/*
  Warnings:

  - You are about to drop the column `image_url` on the `Inspection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "image_url",
ADD COLUMN     "image_urls" TEXT[];
