-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('Technician', 'Leader');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Manager', 'Resident', 'Staff');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('Active', 'Inactive', 'Probation');

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
CREATE TABLE "UserDetails" (
    "user_id" TEXT NOT NULL,
    "positionId" TEXT,
    "departmentId" TEXT,
    "staffStatus" "StaffStatus",
    "staffRole" "StaffRole",

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "apartmentId" TEXT NOT NULL,
    "apartmentName" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("apartmentId")
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
CREATE UNIQUE INDEX "Department_departmentName_key" ON "Department"("departmentName");

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "WorkingPosition"("positionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
