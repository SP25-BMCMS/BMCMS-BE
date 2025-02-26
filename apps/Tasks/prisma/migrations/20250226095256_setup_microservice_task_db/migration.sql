-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Assigned', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('pending', 'inprogress', 'reassigned', 'completed', 'notcompleted');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('InProgress', 'Completed', 'Alert');

-- CreateTable
CREATE TABLE "Task" (
    "task_id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "worklog_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("worklog_id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "assignment_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "inspection_id" SERIAL NOT NULL,
    "task_assignment_id" INTEGER NOT NULL,
    "crack_id" INTEGER NOT NULL,
    "inspected_by" INTEGER NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "description" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("inspection_id")
);

-- CreateTable
CREATE TABLE "RepairMaterial" (
    "repair_material_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "inspection_id" INTEGER NOT NULL,

    CONSTRAINT "RepairMaterial_pkey" PRIMARY KEY ("repair_material_id")
);

-- CreateTable
CREATE TABLE "Material" (
    "material_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("material_id")
);

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_task_assignment_id_fkey" FOREIGN KEY ("task_assignment_id") REFERENCES "TaskAssignment"("assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairMaterial" ADD CONSTRAINT "RepairMaterial_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "Inspection"("inspection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairMaterial" ADD CONSTRAINT "RepairMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("material_id") ON DELETE RESTRICT ON UPDATE CASCADE;
