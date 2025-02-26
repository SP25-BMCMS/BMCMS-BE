/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Apartment_ownerId_key" ON "Apartment"("ownerId");
