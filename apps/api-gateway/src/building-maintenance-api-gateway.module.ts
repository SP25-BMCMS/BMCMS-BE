import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from './users/users.module'
import { BuildingsModule } from './buildings/buildings.module'
import { AreasModule } from './Area/Areas.module'
import { BuildingDetailModule } from './BuildingDetail/buildingDetail.module'
import { LocationDetailModule } from './LocationDetail/locationDetail.module'
import { CracksModule } from './cracks/cracks.module'
import { TasksModule } from './Task/Tasks.module'
import { TaskAssigmentModule } from './TaskAssigment/TaskAssigment.module'
import { worklogModule } from './Worklogs/WorkLog.module'
import { SchedulesModule } from './schedules/Schedules.module'
import { ScheduleJobsController } from './schedulejobs/schedulejobs.controller'
import { schedulejobsModule } from './schedulejobs/schedulejobs.module'
import { InspectionModule } from './Inspection/Inspection.module'
import { RepairMaterialModule } from './RepairMaterial/RepairMaterial.module'
import { NotificationsModule } from './notifications/notifications.module'
import { FeedbackModule } from './Feedback/Feedback.module'
import { MaterialModule } from './Material/Material.module'

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot(),
    BuildingsModule,
    AreasModule,
    BuildingDetailModule,
    LocationDetailModule,
    CracksModule,
    TasksModule,
    TaskAssigmentModule,
    worklogModule,
    SchedulesModule,
    schedulejobsModule,
    InspectionModule,
    RepairMaterialModule,
    InspectionModule,
    NotificationsModule,
    FeedbackModule,
    MaterialModule
  ],
})
export class BuildingMaintenanceApiGatewayModule { }
