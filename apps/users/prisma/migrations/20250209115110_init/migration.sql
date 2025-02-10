-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Manager', 'Resident', 'Employee');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('Active', 'Inactive', 'Probation');

-- CreateEnum
CREATE TYPE "PositionName" AS ENUM ('Staff', 'Leader', 'Manager', 'Admin');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('Active', 'Inactive');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Resident" (
    "residentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apartmentNumber" TEXT,
    "buildingId" TEXT NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("residentId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "EmploymentStatus" NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "Department" (
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "WorkingPosition" (
    "positionId" TEXT NOT NULL,
    "positionName" "PositionName" NOT NULL,
    "description" TEXT,
    "status" "PositionStatus" NOT NULL,

    CONSTRAINT "WorkingPosition_pkey" PRIMARY KEY ("positionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_userId_key" ON "Resident"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentName_key" ON "Department"("departmentName");

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "WorkingPosition"("positionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
