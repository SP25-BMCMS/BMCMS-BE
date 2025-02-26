import { Module } from '@nestjs/common';
import {  WorklogsService } from './Worklog.service';
import { WorklogsController } from './Worklog.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  providers: [WorklogsService],
  controllers: [WorklogsController]
})
export class WorklogsModule {}
