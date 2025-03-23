/*
  Warnings:

  - The primary key for the `Inspection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Material` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RepairMaterial` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "RepairMaterial" DROP CONSTRAINT "RepairMaterial_inspection_id_fkey";

-- DropForeignKey
ALTER TABLE "RepairMaterial" DROP CONSTRAINT "RepairMaterial_material_id_fkey";

-- AlterTable
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_pkey",
ALTER COLUMN "inspection_id" DROP DEFAULT,
ALTER COLUMN "inspection_id" SET DATA TYPE TEXT,
ALTER COLUMN "crack_id" SET DATA TYPE TEXT,
ALTER COLUMN "inspected_by" SET DATA TYPE TEXT,
ADD CONSTRAINT "Inspection_pkey" PRIMARY KEY ("inspection_id");
DROP SEQUENCE "Inspection_inspection_id_seq";

-- AlterTable
ALTER TABLE "Material" DROP CONSTRAINT "Material_pkey",
ALTER COLUMN "material_id" DROP DEFAULT,
ALTER COLUMN "material_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Material_pkey" PRIMARY KEY ("material_id");
DROP SEQUENCE "Material_material_id_seq";

-- AlterTable
ALTER TABLE "RepairMaterial" DROP CONSTRAINT "RepairMaterial_pkey",
ALTER COLUMN "repair_material_id" DROP DEFAULT,
ALTER COLUMN "repair_material_id" SET DATA TYPE TEXT,
ALTER COLUMN "task_id" SET DATA TYPE TEXT,
ALTER COLUMN "material_id" SET DATA TYPE TEXT,
ALTER COLUMN "inspection_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "RepairMaterial_pkey" PRIMARY KEY ("repair_material_id");
DROP SEQUENCE "RepairMaterial_repair_material_id_seq";

-- AddForeignKey
ALTER TABLE "RepairMaterial" ADD CONSTRAINT "RepairMaterial_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "Inspection"("inspection_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairMaterial" ADD CONSTRAINT "RepairMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("material_id") ON DELETE RESTRICT ON UPDATE CASCADE;
