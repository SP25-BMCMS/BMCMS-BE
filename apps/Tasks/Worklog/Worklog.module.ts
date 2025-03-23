import { Module } from '@nestjs/common';
import {  WorkLogService } from './Worklog.service';
import { WorkLogController } from './Worklog.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  providers: [WorkLogService],
  controllers: [WorkLogController]
})
export class WorklogsModule {}
