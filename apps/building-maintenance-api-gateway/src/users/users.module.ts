import { Module } from '@nestjs/common'
import { ClientProxyFactory } from '@nestjs/microservices'
import { PassportModule } from '@nestjs/passport'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { ClientConfigService } from 'apps/configs/client-confit.service'
import { JwtConfigModule } from 'apps/configs/jwt-config.module'
import { USERS_CLIENT } from '../constraints'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'


@Module({
  imports: [
    ClientConfigModule,
    JwtConfigModule,
    PassportModule,
  ],
  providers: [UsersService, JwtStrategy, LocalStrategy, {
    provide: USERS_CLIENT,
    useFactory: (configService: ClientConfigService) => {
      const clientOptions = configService.usersClientOptions
      return ClientProxyFactory.create(clientOptions)
    },
    inject: [ClientConfigService]
  }],
  controllers: [UsersController],
})
export class UsersModule { }
