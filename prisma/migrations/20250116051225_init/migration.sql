-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Resident', 'Employee');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('Active', 'Inactive', 'Probation');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NotAssigned', 'InProgress', 'RequiresAssistance');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Missed');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('SwimmingPool', 'Terrace', 'Garden', 'Parking', 'Gym', 'Lobby', 'Other');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('Left', 'Right', 'Center');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('Reported', 'Verified', 'Completed');

-- CreateEnum
CREATE TYPE "CrackStatus" AS ENUM ('Desscription', 'Verified', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('Pending', 'InProgress', 'Alert', 'Completed', 'NotCompleted');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('InProgress', 'Completed', 'Alert');

-- CreateEnum
CREATE TYPE "PositionName" AS ENUM ('Staff', 'Leader', 'Manager', 'Admin');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Specific');

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
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
    "residentId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "apartmentNumber" TEXT,
    "buildingId" INTEGER NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("residentId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "status" "EmploymentStatus" NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedbackId" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "feedbackBy" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId")
);

-- CreateTable
CREATE TABLE "Task" (
    "taskId" SERIAL NOT NULL,
    "crackId" INTEGER,
    "description" TEXT NOT NULL,
    "scheduleJobId" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "workLogId" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("workLogId")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "scheduleId" SERIAL NOT NULL,
    "scheduleName" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("scheduleId")
);

-- CreateTable
CREATE TABLE "ScheduleJob" (
    "scheduleJobId" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleJob_pkey" PRIMARY KEY ("scheduleJobId")
);

-- CreateTable
CREATE TABLE "Building" (
    "buildingId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "numberFloor" INTEGER NOT NULL,
    "imageCover" TEXT,
    "areaId" INTEGER,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("buildingId")
);

-- CreateTable
CREATE TABLE "Area" (
    "areaId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("areaId")
);

-- CreateTable
CREATE TABLE "BuildingDetail" (
    "buildingDetailId" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaType" "AreaType" NOT NULL,
    "floorNumber" INTEGER NOT NULL,

    CONSTRAINT "BuildingDetail_pkey" PRIMARY KEY ("buildingDetailId")
);

-- CreateTable
CREATE TABLE "LocationDetail" (
    "locationDetailId" SERIAL NOT NULL,
    "buildingDetailId" INTEGER NOT NULL,
    "roomNumber" TEXT,
    "floorNumber" INTEGER NOT NULL,
    "positionSide" "PositionSide" NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "LocationDetail_pkey" PRIMARY KEY ("locationDetailId")
);

-- CreateTable
CREATE TABLE "CrackReport" (
    "crackId" SERIAL NOT NULL,
    "buildingDetailId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "reportedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackReport_pkey" PRIMARY KEY ("crackId")
);

-- CreateTable
CREATE TABLE "CrackDetail" (
    "crackDetailsId" SERIAL NOT NULL,
    "crackId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CrackStatus" NOT NULL,
    "severity" "Severity" NOT NULL,
    "reportedBy" INTEGER NOT NULL,
    "verifiedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackDetail_pkey" PRIMARY KEY ("crackDetailsId")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "assignmentId" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("assignmentId")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "inspectionId" SERIAL NOT NULL,
    "crackId" INTEGER NOT NULL,
    "inspectedBy" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "assignmentId" INTEGER NOT NULL,
    "description" TEXT,
    "status" "InspectionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("inspectionId")
);

-- CreateTable
CREATE TABLE "Department" (
    "departmentId" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "WorkingPosition" (
    "positionId" SERIAL NOT NULL,
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
CREATE UNIQUE INDEX "Feedback_taskId_key" ON "Feedback"("taskId");

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

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_feedbackBy_fkey" FOREIGN KEY ("feedbackBy") REFERENCES "Resident"("residentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_crackId_fkey" FOREIGN KEY ("crackId") REFERENCES "CrackDetail"("crackDetailsId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_scheduleJobId_fkey" FOREIGN KEY ("scheduleJobId") REFERENCES "ScheduleJob"("scheduleJobId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleJob" ADD CONSTRAINT "ScheduleJob_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("scheduleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleJob" ADD CONSTRAINT "ScheduleJob_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("buildingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("areaId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingDetail" ADD CONSTRAINT "BuildingDetail_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("buildingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDetail" ADD CONSTRAINT "LocationDetail_buildingDetailId_fkey" FOREIGN KEY ("buildingDetailId") REFERENCES "BuildingDetail"("buildingDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackReport" ADD CONSTRAINT "CrackReport_buildingDetailId_fkey" FOREIGN KEY ("buildingDetailId") REFERENCES "BuildingDetail"("buildingDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackDetail" ADD CONSTRAINT "CrackDetail_crackId_fkey" FOREIGN KEY ("crackId") REFERENCES "CrackReport"("crackId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TaskAssignment"("assignmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectedBy_fkey" FOREIGN KEY ("inspectedBy") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;
