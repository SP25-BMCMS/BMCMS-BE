/*
  Warnings:

  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resident` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_positionId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_userId_fkey";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "Resident";

-- CreateTable
CREATE TABLE "UserDetails" (
    "user_id" TEXT NOT NULL,
    "apartmentNumber" TEXT,
    "buildingId" TEXT,
    "positionId" TEXT,
    "departmentId" TEXT,
    "status" "EmploymentStatus",

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
