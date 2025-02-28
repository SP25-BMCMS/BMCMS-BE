/*
  Warnings:

  - You are about to drop the column `status` on the `UserDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserDetails" DROP COLUMN "status",
ADD COLUMN     "staffStatus" "StaffStatus";
