import { Module } from '@nestjs/common';
import { WorkingPositionsService } from './working-positions.service';
import { WorkingPositionsController } from './working-positions.controller';

@Module({
  controllers: [WorkingPositionsController],
  providers: [WorkingPositionsService],
})
export class WorkingPositionsModule {}
