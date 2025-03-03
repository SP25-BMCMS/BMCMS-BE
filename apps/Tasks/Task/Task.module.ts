import { TaskService } from './Task.service';
import {TasksController } from './Task.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [PrismaModule],
  providers: [TaskService],
  controllers: [TasksController],
})
export class TasksModule {}
