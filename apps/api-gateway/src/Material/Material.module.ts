import { Module } from '@nestjs/common';
import { MaterialController } from './Material.controller';
import { MaterialService } from './Material.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { TASK_CLIENT } from '../constraints';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';

@Module({
    imports: [ClientConfigModule],
    controllers: [MaterialController],
    providers: [
        MaterialService,
        {
            provide: TASK_CLIENT,
            useFactory: (configService: ClientConfigService) => {
                const clientOptions = configService.TasksClientOptions;
                return ClientProxyFactory.create(clientOptions);
            },
            inject: [ClientConfigService],
        },
    ],
})
export class MaterialModule {} 