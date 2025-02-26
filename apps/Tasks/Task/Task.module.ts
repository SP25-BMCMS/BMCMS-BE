import {TasksService as TasksService } from './Task.service';
import {TasksController } from './Task.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [PrismaModule],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
