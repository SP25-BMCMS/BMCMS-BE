import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientProxyFactory } from '@nestjs/microservices';
import { BUILDING_CLIENT } from '../constraints';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        ClientConfigModule,
        ConfigModule,
        MulterModule.register(),
    ],
    controllers: [ContractsController],
    providers: [ContractsService,
        {
            provide: BUILDING_CLIENT,
            useFactory: (configService: ClientConfigService) => {
                const clientOptions = configService.buildingsClientOptions; // Getting the client options
                return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
            },
            inject: [ClientConfigService],
        },
    ],
})
export class ContractsModule { }
