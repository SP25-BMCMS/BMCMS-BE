import { Module } from '@nestjs/common'
import { BuildingsService } from './buildings.service'
import { BuildingsController } from './buildings.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { ConfigService } from '@nestjs/config'

const BUILDINGS_CLIENT = 'BUILDINGS_CLIENT'
const USERS_CLIENT = 'USERS_CLIENT'
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
      {
        name: USERS_CLIENT,
        useFactory: (configService: ConfigService) => {
          const isLocal = process.env.NODE_ENV !== 'production'
          const usersHost = isLocal
            ? configService.get('USERS_SERVICE_HOST', 'localhost')
            : 'users_service'
          const usersPort = configService.get('USERS_SERVICE_PORT', '3001')

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
