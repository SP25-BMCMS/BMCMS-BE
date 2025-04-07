/*
  Warnings:

  - Added the required column `inspection_id` to the `LocationDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LocationDetail" ADD COLUMN     "inspection_id" TEXT NOT NULL;
