import { Module } from '@nestjs/common'
import { ClientProxyFactory } from '@nestjs/microservices'
import { PassportModule } from '@nestjs/passport'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ClientConfigService } from 'apps/configs/client-config.service'
import { JwtConfigModule } from 'apps/configs/jwt-config.module'
import { USERS_CLIENT } from '../constraints'
import { JwtStrategy } from '../strategies/jwt.strategy'
import { LocalStrategy } from '../strategies/local.strategy'
import { UsersController } from './user/users.controller'
import { UsersService } from './user/users.service'
import { ResidentService } from './resident/resident.service'
import { ResidentController } from './resident/resident.controller'
import { EmployeeModule } from './employee/employee.module'
import { EmployeeController } from './employee/employee.controller'
import { EmployeeService } from './employee/employee.service'
import { ApartmentService } from './apartment/apartment.service'
import { ApartmentController } from './apartment/apartment.controller'


@Module({
  imports: [
    ClientConfigModule,
    JwtConfigModule,
    PassportModule,
    EmployeeModule
  ],
  providers: [
    UsersService,
    ResidentService,
    EmployeeService,
    JwtStrategy,
    LocalStrategy,
    ApartmentService,
    {
      provide: USERS_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.usersClientOptions
        return ClientProxyFactory.create(clientOptions)
      },
      inject: [ClientConfigService]
    },
  ],
  controllers: [UsersController, ResidentController, EmployeeController,ApartmentController],
})
export class UsersModule { }
