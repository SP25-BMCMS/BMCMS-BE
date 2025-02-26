-- DropForeignKey
ALTER TABLE "Apartment" DROP CONSTRAINT "Apartment_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
