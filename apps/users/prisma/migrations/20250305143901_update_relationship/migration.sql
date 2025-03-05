-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "WorkingPosition"("positionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;
