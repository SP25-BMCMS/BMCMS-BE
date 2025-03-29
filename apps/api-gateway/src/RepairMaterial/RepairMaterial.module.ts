import { Module } from '@nestjs/common';
import {
  ClientProxyFactory,
  ClientOptions,
  Transport,
} from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { RepairMaterialService } from './RepairMaterial.service';
import { TASK_CLIENT } from '../constraints';
import { RepairMaterialController } from './RepairMaterial.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [ClientConfigModule, ConfigModule, PassportModule],
  providers: [
    RepairMaterialService,
    {
      provide: TASK_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.TasksClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [RepairMaterialController],
})
export class RepairMaterialModule {}
