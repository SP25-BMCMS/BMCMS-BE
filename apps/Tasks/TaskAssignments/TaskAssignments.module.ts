import { Module } from '@nestjs/common';
import { TaskAssignmentsService as TaskAssignmentsService } from './TaskAssignments.service';
import { TaskAssignmentsController } from './TaskAssignments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TaskAssignmentsService],
  controllers: [TaskAssignmentsController],
})
export class TaskAssignmentsModule {}
