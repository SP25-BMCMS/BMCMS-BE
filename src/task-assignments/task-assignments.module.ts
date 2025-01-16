import { Module } from '@nestjs/common';
import { TaskAssignmentsService } from './task-assignments.service';
import { TaskAssignmentsController } from './task-assignments.controller';

@Module({
  controllers: [TaskAssignmentsController],
  providers: [TaskAssignmentsService],
})
export class TaskAssignmentsModule {}
