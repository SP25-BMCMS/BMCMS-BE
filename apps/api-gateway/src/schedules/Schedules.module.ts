import { Module } from '@nestjs/common';
import {
  ClientProxyFactory,
  ClientOptions,
  Transport,
} from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { SchedulesService } from './Schedules.service';
import { SCHEDULE_CLIENT } from '../constraints';
import { SchedulesController as SchedulesController } from './Schedules.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtConfigModule } from 'apps/configs/jwt-config.module';

@Module({
  imports: [
    ClientConfigModule, 
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtConfigModule
  ],
  providers: [
    SchedulesService,
    JwtStrategy,
    {
      provide: SCHEDULE_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.SchedulesClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
