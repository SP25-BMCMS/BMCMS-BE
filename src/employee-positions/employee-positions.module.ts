import { Module } from '@nestjs/common';
import { EmployeePositionsController } from './employee-positions.controller';
import { EmployeePositionsService } from './employee-positions.service';

@Module({
  controllers: [EmployeePositionsController],
  providers: [EmployeePositionsService]
})
export class EmployeePositionsModule {}
