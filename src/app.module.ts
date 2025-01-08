import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { EmployeePositionsModule } from './employee-positions/employee-positions.module';
import { ResidentsModule } from './residents/residents.module';
import { BuildingsModule } from './buildings/buildings.module';
import { AreasModule } from './areas/areas.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ScheduleJobsModule } from './schedule-jobs/schedule-jobs.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { CracksModule } from './cracks/cracks.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskAssignmentsModule } from './task-assignments/task-assignments.module';
import { InspectionsModule } from './inspections/inspections.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [UsersModule, EmployeesModule, EmployeePositionsModule, ResidentsModule, BuildingsModule, AreasModule, SchedulesModule, ScheduleJobsModule, FeedbacksModule, CracksModule, TasksModule, TaskAssignmentsModule, InspectionsModule, DepartmentsModule],
})
export class AppModule { }
