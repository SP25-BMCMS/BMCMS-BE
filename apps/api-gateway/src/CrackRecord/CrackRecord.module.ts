import { Module } from '@nestjs/common';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CrackRecordController } from './CrackRecord.controller';
import { CrackRecordService } from './CrackRecord.service';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { BUILDING_CLIENT } from '../constraints';
import { ClientConfigModule } from 'apps/configs/client-config.module';

@Module({
    imports: [ClientConfigModule, ConfigModule],
  controllers: [CrackRecordController],
  providers: [
    CrackRecordService,
    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions  ;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
})
export class CrackRecordModule {} 