import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { join } from 'path'

async function bootstrap() {
  const isLocal = process.env.NODE_ENV !== 'production'
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: join(process.cwd(), 'libs/contracts/src/users/users.proto'),
        url: isLocal ? "localhost:3001" : `0.0.0.0:3001`
      },
    },
  )
  await app.listen()
}

bootstrap()
