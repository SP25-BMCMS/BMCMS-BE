import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AreasModule } from './areas/areas.module';
import { BuildingsModule } from './buildings/buildings.module';
import { LocationDetailsModule } from './location-details/location-details.module';
import { BuildingDetailsModule } from './building-details/building-details.module';
import { ResidentsModule } from './residents/residents.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { InspectionsModule } from './inspections/inspections.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ScheduleJobsModule } from './schedule-jobs/schedule-jobs.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskAssignmentsModule } from './task-assignments/task-assignments.module';
import { CrackDetailsModule } from './crack-details/crack-details.module';
import { WorkLogsModule } from './work-logs/work-logs.module';
import { WorkingPositionsModule } from './working-positions/working-positions.module';
import { CrackReportsModule } from './crack-reports/crack-reports.module';

@Module({
  imports: [
    UsersModule,
    AreasModule,
    BuildingsModule,
    LocationDetailsModule,
    BuildingDetailsModule,
    ResidentsModule,
    EmployeesModule,
    DepartmentsModule,
    InspectionsModule,
    SchedulesModule,
    ScheduleJobsModule,
    FeedbacksModule,
    TasksModule,
    TaskAssignmentsModule,
    CrackDetailsModule,
    WorkLogsModule,
    WorkingPositionsModule,
    CrackReportsModule,

  ],
})
export class AppModule { }
