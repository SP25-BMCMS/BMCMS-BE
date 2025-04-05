import { Module } from '@nestjs/common';
import { InspectionsService } from './Inspections.service';
import { InspectionsController } from './Inspections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientConfigModule,
  ],
  providers: [
    InspectionsService,
    {
      provide: 'CRACK_CLIENT',
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.cracksClientOptions;
        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
  controllers: [InspectionsController],
  exports: [InspectionsService],
})
export class InspectionsModule {}
// import { Module } from '@nestjs/common';
// import { InspectionsService } from './Inspections.service';
// import { InspectionsController } from './Inspections.controller';
// import { PrismaModule } from '../prisma/prisma.module';
// import { ClientsModule, Transport } from '@nestjs/microservices';
// import { ConfigModule, ConfigService } from '@nestjs/config';

// @Module({
//   imports: [
//     PrismaModule,
//     ConfigModule,
//     ClientsModule.registerAsync([
//       {
//         name: 'CRACK_CLIENT',
//         useFactory: (configService: ConfigService) => {
//           const user = configService.get('RABBITMQ_USER');
//           const password = configService.get('RABBITMQ_PASSWORD');
//           const host = configService.get('RABBITMQ_HOST');
//           const isLocal = process.env.NODE_ENV !== 'production';
//           return {
//             transport: Transport.RMQ,
//             options: {
//               urls: isLocal
//                 ? [`amqp://${user}:${password}@${host}`]
//                 : [`amqp://${user}:${password}@rabbitmq:5672`],
//               queue: 'cracks_queue',
//               queueOptions: {
//                 durable: true,
//                 prefetchCount: 1,
//               },
//             },
//           };
//         },
//         inject: [ConfigService],
//       },
//     ]),
//   ],
//   providers: [InspectionsService],
//   controllers: [InspectionsController],
//   exports: [InspectionsService, ClientsModule],
// })
// export class InspectionsModule {}
