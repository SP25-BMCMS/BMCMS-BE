import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { join } from 'path'

async function bootstrap() {
  // const isLocal = process.env.NODE_ENV !== 'production'
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   AppModule,
  //   {
  //     transport: Transport.GRPC,
  //     options: {
  //       package: 'users',
  //       protoPath: join(process.cwd(), 'libs/contracts/src/users/users.proto'),
  //       url: isLocal ? "localhost:3001" : `0.0.0.0:3001`
  //     },
  //   },
  // );
    
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [process.env.RABBIT_MQ_URI || 'amqp://localhost:5672'],
  //     queue: 'users_queue',
  //     queueOptions: {
  //       durable: false,
  //     },
  //   },
  // });

  
  // // Start both microservices
  // await app.startAllMicroservices();
  // await app.listen(3000);
  // console.log('Users microservice running with gRPC and RabbitMQ');
  const isLocal = process.env.NODE_ENV !== 'production'
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: join(process.cwd(), 'libs/contracts/src/users/users.proto'),
        url: isLocal ? "localhost:3001" : `0.0.0.0:3001`,
        keepalive: {
          keepaliveTimeMs: 10000,
          keepaliveTimeoutMs: 5000,
          keepalivePermitWithoutCalls: 1
        },
        maxSendMessageLength: 4 * 1024 * 1024,
        maxReceiveMessageLength: 4 * 1024 * 1024
      },
    },
  )
  await app.listen()
}

bootstrap()

// // Create the main microservice (GRPC)
  // const app = await NestFactory.create(AppModule);
  
  // // Register gRPC microservice
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.GRPC,
  //   options: {
  //     package: 'users',
  //     protoPath: join(process.cwd(), 'libs/contracts/src/users/users.proto'),
  //     url: `localhost:3001`
  //   },
  // });
  
  // // Register RabbitMQ microservice
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [process.env.RABBIT_MQ_URI || 'amqp://localhost:5672'],
  //     queue: 'users_queue',
  //     queueOptions: {
  //       durable: false