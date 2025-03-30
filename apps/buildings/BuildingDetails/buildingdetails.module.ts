import { Module } from '@nestjs/common';
import { BuildingDetailsController } from './buildingdetails.controller';
import { BuildingDetailsService } from './buildingdetails.service';
import { PrismaModule } from '../../users/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT';

@Module({
  imports: [PrismaModule,
    ClientsModule.register([
      {
        name: BUILDINGS_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin@rabbitmq:5672'],
          queue: 'buildings_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [BuildingDetailsController],
  providers: [BuildingDetailsService],
})
export class BuildingDetailsModule { }
