-- AlterTable
ALTER TABLE "Building"
ADD COLUMN "Warranty_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Building"
ALTER COLUMN "completion_date" TYPE DATE USING "completion_date"::date;

ALTER TABLE "Building"
ALTER COLUMN "construction_date" TYPE DATE USING "construction_date"::date;
