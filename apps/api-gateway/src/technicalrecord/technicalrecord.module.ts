import { Module } from '@nestjs/common';
import { TechnicalRecordService } from './technicalrecord.service';
import { ClientProxyFactory } from '@nestjs/microservices';
import { BUILDING_CLIENT } from '../constraints';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ConfigModule } from '@nestjs/config';
import { TechnicalRecordController } from './technicalrecord.controller';

@Module({
    imports: [
        ClientConfigModule,
        ConfigModule,
    ],
    controllers: [TechnicalRecordController],
    providers: [
        TechnicalRecordService,
        {
            provide: BUILDING_CLIENT,
            useFactory: (configService: ClientConfigService) => {
                const clientOptions = configService.buildingsClientOptions;
                return ClientProxyFactory.create(clientOptions);
            },
            inject: [ClientConfigService],
        },
    ],
})
export class TechnicalRecordModule { } 