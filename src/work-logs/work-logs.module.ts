import { Module } from '@nestjs/common';
import { WorkLogsService } from './work-logs.service';
import { WorkLogsController } from './work-logs.controller';

@Module({
  controllers: [WorkLogsController],
  providers: [WorkLogsService],
})
export class WorkLogsModule {}
