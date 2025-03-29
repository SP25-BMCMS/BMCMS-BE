import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InspectionsModule } from '../Inspections/Inspections.module';
import { TasksModule } from '../Task/Task.module';
import { TasksController } from '../Task/Task.controller';
import { TaskService } from '../Task/Task.service';
import { RepairMaterialsModule } from '../RepairMaterials/RepairMaterials.module';
import { RepairMaterialsController } from '../RepairMaterials/RepairMaterials.controller';
import { RepairMaterialsService } from '../RepairMaterials/RepairMaterials.service';
import { InspectionsService } from '../Inspections/Inspections.service';
import { InspectionsController } from '../Inspections/Inspections.controller';
import { TaskAssignmentsModule } from '../TaskAssignments/TaskAssignments.module';
import { WorkLogModule } from '../Worklog/Worklog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    InspectionsModule,
    PrismaModule,
    TasksModule,
    RepairMaterialsModule,
    TaskAssignmentsModule,
    WorkLogModule,
  ],
  controllers: [
    TasksController,
    RepairMaterialsController,
    InspectionsController,
  ],
  providers: [TaskService, RepairMaterialsService, InspectionsService],
})
export class TaskModule {}
