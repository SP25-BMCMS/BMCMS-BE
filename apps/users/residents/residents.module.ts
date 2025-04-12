import { Module } from '@nestjs/common'
import { ResidentsService } from './residents.service'
import { ResidentsController } from './residents.controller'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PrismaModule } from '../prisma/prisma.module'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'BUILDING_CLIENT',
        useFactory: (configService: ConfigService) => {
          const url = configService.get('RABBITMQ_URL')
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: 'buildings_queue',
              queueOptions: {
                durable: true,
              },
              socketOptions: {
                heartbeatIntervalInSeconds: 5,
                reconnectTimeInSeconds: 5,
              },
            },
          }
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
})
export class ResidentsModule { }
