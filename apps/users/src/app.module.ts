import { Module } from '@nestjs/common';
import { AuthController } from '../auth/auth.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ResidentsModule } from '../residents/residents.module';
import { ApartmentsModule } from '../Apartments/apartments.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EmployeesModule } from '../employees/employees.module';

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
  providers: [AuthService],
})
export class AppModule { }
