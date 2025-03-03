import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import {  InspectionsModule } from '../Inspections/Inspections.module';
import {   TasksModule} from '../Task/Task.module';
import { TasksController } from '../Task/Task.controller';
import { TaskService } from '../Task/Task.service';
import { RepairMaterialsModule } from '../RepairMaterials/RepairMaterials.module';
import { RepairMaterialsController } from '../RepairMaterials/RepairMaterials.controller';
import { RepairMaterialsService } from '../RepairMaterials/RepairMaterials.service';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    InspectionsModule,
    PrismaModule,
    TasksModule,
    RepairMaterialsModule
  ],
    controllers: [TasksController,RepairMaterialsController],
      providers: [TaskService,RepairMaterialsService],
})
export class TaskModule {}
