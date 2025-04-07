import { Module } from '@nestjs/common';
import { InspectionsService } from './Inspections.service';
import { InspectionsController } from './Inspections.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientProxyFactory, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { join } from 'path';

const USERS_CLIENT = 'USERS_CLIENT';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: USERS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const isLocal = process.env.NODE_ENV !== 'production';
          const usersHost = isLocal
            ? configService.get('USERS_SERVICE_HOST', 'localhost')
            : 'users_service';
          const usersPort = configService.get('USERS_SERVICE_PORT', '3001');

          return {
            transport: Transport.GRPC,
            options: {
              url: `${usersHost}:${usersPort}`,
              package: 'users',
              protoPath: join(
                process.cwd(),
                'libs/contracts/src/users/users.proto',
              ),
              loader: {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
              },
              maxSendMessageLength: 10 * 1024 * 1024, // 10MB
              maxReceiveMessageLength: 10 * 1024 * 1024, // 10MB
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
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
export class InspectionsModule { }
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
