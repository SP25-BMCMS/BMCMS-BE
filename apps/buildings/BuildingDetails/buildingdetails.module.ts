import { Module } from '@nestjs/common'
import { BuildingDetailsController } from './buildingdetails.controller'
import { BuildingDetailsService } from './buildingdetails.service'
import { PrismaModule } from '../../users/prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'

@Module({
  imports: [PrismaModule,
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
  controllers: [BuildingDetailsController],
  providers: [BuildingDetailsService],
})
export class BuildingDetailsModule { }
