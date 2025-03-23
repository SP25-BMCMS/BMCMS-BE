-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('Reported', 'Verified', 'Completed');

-- CreateEnum
CREATE TYPE "CrackStatus" AS ENUM ('Description', 'Verified', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Low', 'Medium', 'High');

-- CreateTable
CREATE TABLE "CrackReport" (
    "crackId" TEXT NOT NULL,
    "buildingDetailId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "reportedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackReport_pkey" PRIMARY KEY ("crackId")
);

-- CreateTable
CREATE TABLE "CrackDetail" (
    "crackDetailsId" TEXT NOT NULL,
    "crackId" TEXT NOT NULL,
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
CREATE TABLE "Material" (
    "materialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("materialId")
);

-- CreateTable
CREATE TABLE "CrackRepairMaterial" (
    "crackRepairMaterialId" TEXT NOT NULL,
    "crackDetailsId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrackRepairMaterial_pkey" PRIMARY KEY ("crackRepairMaterialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CrackRepairMaterial_crackDetailsId_materialId_key" ON "CrackRepairMaterial"("crackDetailsId", "materialId");

-- AddForeignKey
ALTER TABLE "CrackDetail" ADD CONSTRAINT "CrackDetail_crackId_fkey" FOREIGN KEY ("crackId") REFERENCES "CrackReport"("crackId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackRepairMaterial" ADD CONSTRAINT "CrackRepairMaterial_crackDetailsId_fkey" FOREIGN KEY ("crackDetailsId") REFERENCES "CrackDetail"("crackDetailsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrackRepairMaterial" ADD CONSTRAINT "CrackRepairMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;
