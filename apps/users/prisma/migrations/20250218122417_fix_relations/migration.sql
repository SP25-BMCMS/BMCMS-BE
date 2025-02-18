/*
  Warnings:

  - The primary key for the `Employee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `employeeId` on the `Employee` table. All the data in the column will be lost.
  - The primary key for the `Resident` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `residentId` on the `Resident` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_positionId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_userId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_pkey",
DROP COLUMN "employeeId",
ADD CONSTRAINT "Employee_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_pkey",
DROP COLUMN "residentId",
ADD CONSTRAINT "Resident_pkey" PRIMARY KEY ("userId");

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "WorkingPosition"("positionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
