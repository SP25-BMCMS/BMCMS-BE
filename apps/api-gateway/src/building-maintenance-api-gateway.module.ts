import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule } from '@nestjs/microservices'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { USERS_CLIENT, BUILDING_CLIENT, TASK_CLIENT, SCHEDULE_CLIENT, CRACK_CLIENT, NOTIFICATION_CLIENT } from './constraints'
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
import { schedulejobsModule } from './schedulejobs/schedulejobs.module'
import { InspectionModule } from './Inspection/Inspection.module'
import { RepairMaterialModule } from './RepairMaterial/RepairMaterial.module'
import { NotificationsModule } from './notifications/notifications.module'
import { FeedbackModule } from './Feedback/Feedback.module'
import { MaterialModule } from './Material/Material.module'
import { ChatbotModule } from './chatbot/chatbot.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { ContractsModule } from './contract/contracts.module'
import { CrackRecordModule } from './CrackRecord/CrackRecord.module'
import { MaintenanceCycleModule } from './MaintenanceCycle/MaintenanceCycle.module'
import { MaintenancehistoryModule } from './maintenancehistory/maintenancehistory.module'
import { DeviceModule } from './Device/Device.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: USERS_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.usersClientOptions
        },
        inject: [ClientConfigService],
      },
      {
        name: BUILDING_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.buildingsClientOptions
        },
        inject: [ClientConfigService],
      },
      {
        name: TASK_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.TasksClientOptions
        },
        inject: [ClientConfigService],
      },
      {
        name: SCHEDULE_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.SchedulesClientOptions
        },
        inject: [ClientConfigService],
      },
      {
        name: CRACK_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.cracksClientOptions
        },
        inject: [ClientConfigService],
      },
      {
        name: NOTIFICATION_CLIENT,
        imports: [ClientConfigModule],
        useFactory: (clientConfigService: ClientConfigService) => {
          return clientConfigService.NotificationsClientOptions
        },
        inject: [ClientConfigService],
      },
    ]),
    UsersModule,
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
    NotificationsModule,
    FeedbackModule,
    MaterialModule,
    ChatbotModule,
    DashboardModule,
    ContractsModule,
    CrackRecordModule,
    MaintenanceCycleModule,
    MaintenancehistoryModule,
    DeviceModule,
  ],
})
export class BuildingMaintenanceApiGatewayModule { }
