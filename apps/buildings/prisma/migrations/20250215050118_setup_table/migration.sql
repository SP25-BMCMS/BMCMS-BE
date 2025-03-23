-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('SwimmingPool', 'Terrace', 'Garden', 'Parking', 'Gym', 'Lobby', 'Other');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('Left', 'Right', 'Center');

-- CreateTable
CREATE TABLE "Building" (
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "numberFloor" INTEGER NOT NULL,
    "imageCover" TEXT,
    "areaId" TEXT,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("buildingId")
);

-- CreateTable
CREATE TABLE "Area" (
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("areaId")
);

-- CreateTable
CREATE TABLE "BuildingDetail" (
    "buildingDetailId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaType" "AreaType" NOT NULL,
    "floorNumber" INTEGER NOT NULL,

    CONSTRAINT "BuildingDetail_pkey" PRIMARY KEY ("buildingDetailId")
);

-- CreateTable
CREATE TABLE "LocationDetail" (
    "locationDetailId" TEXT NOT NULL,
    "buildingDetailId" TEXT NOT NULL,
    "roomNumber" TEXT,
    "floorNumber" INTEGER NOT NULL,
    "positionSide" "PositionSide" NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "LocationDetail_pkey" PRIMARY KEY ("locationDetailId")
);

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("areaId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingDetail" ADD CONSTRAINT "BuildingDetail_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("buildingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDetail" ADD CONSTRAINT "LocationDetail_buildingDetailId_fkey" FOREIGN KEY ("buildingDetailId") REFERENCES "BuildingDetail"("buildingDetailId") ON DELETE RESTRICT ON UPDATE CASCADE;
