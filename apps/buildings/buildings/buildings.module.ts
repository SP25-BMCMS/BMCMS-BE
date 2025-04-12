import { Module } from '@nestjs/common'
import { BuildingsService } from './buildings.service'
import { BuildingsController } from './buildings.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { ConfigService } from '@nestjs/config'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: BUILDINGS_CLIENT,
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
            },
          }
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [BuildingsService],
  controllers: [BuildingsController],
  exports: [BuildingsService],
})
export class BuildingsModule { }
