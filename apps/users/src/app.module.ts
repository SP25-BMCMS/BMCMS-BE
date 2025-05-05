import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthController } from '../auth/auth.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ResidentsModule } from '../residents/residents.module';
import { ApartmentsModule } from '../Apartments/apartments.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EmployeesModule } from '../employees/employees.module';
import { EnumLabelInterceptor } from '../../../libs/common/src/interceptors/enum-label.interceptor';

@Module({
  imports: [
    UsersModule,
    ResidentsModule,
    AuthModule,
    PrismaModule,
    ApartmentsModule,
    DepartmentsModule,
    EmployeesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EnumLabelInterceptor,
    },
  ],
})
export class AppModule { }
