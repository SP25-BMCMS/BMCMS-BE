
import { Module } from '@nestjs/common';
import { ClientProxyFactory, ClientOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-confit.service';
import {  AreasService } from './Areas.service';
import { BUILDING_CLIENT } from '../constraints';
import { AreasController as AreasController } from './Areas.controller';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [    ClientConfigModule,
    ConfigModule
  ],
  providers: [
    AreasService,
        PassportModule,
    
    {
      provide: BUILDING_CLIENT,
      useFactory: (configService: ClientConfigService) => {
        const clientOptions = configService.buildingsClientOptions; // Getting the client options
        return ClientProxyFactory.create(clientOptions); // Using the correct options for RabbitMQ
      },
      inject: [ClientConfigService], // Inject ClientConfigService to get the correct options
    },
  ],
  controllers: [AreasController],
})
// export class BuildingsModule {}
// @Module({
//   controllers: [AreasController],
//   imports: [
//     ConfigModule,
//     ClientConfigModule
//   ],
//   providers: [
//     AreasService,
//     {
//       provide: BUILDING_CLIENT,
//       useFactory: (configService: ConfigService) => {

//         const user = configService.get('RABBITMQ_USER');
//         const password = configService.get('RABBITMQ_PASSWORD');
//         const host = configService.get('RABBITMQ_HOST');
//         const queueName = configService.get('RABBITMQ_QUEUE_NAME');

//         return ClientProxyFactory.create({
//           transport: Transport.RMQ,
//           options: {
//             urls: [`amqp://${user}:${password}@${host}`],
//             queue: queueName,
//             queueOptions: {
//               durable: true,
//             },
//           },
//         });
//       },
//       inject: [ConfigService,ClientConfigService],
//     },
//   ],
// })
export class AreasModule { }