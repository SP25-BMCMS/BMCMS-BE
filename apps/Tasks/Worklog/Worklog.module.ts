import { Module } from '@nestjs/common';
import { WorkLogController } from './Worklog.controller';
import { WorkLogService } from './Worklog.service';
import { PrismaModule } from '../../users/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkLogController],
  providers: [WorkLogService],
})
export class WorkLogModule {}
