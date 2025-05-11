-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('FireSafetyEngineering', 'ChiefTechnician', 'ElectricalEngineering', 'ElevatorEngineering', 'AirConditioningEngineering', 'CCTVEngineering', 'WaterEngineering', 'StructuralEngineering', 'ManagementBoard');

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "departmentType" "DepartmentType";
