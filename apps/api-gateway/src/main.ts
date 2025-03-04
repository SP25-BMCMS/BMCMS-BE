import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { BuildingMaintenanceApiGatewayModule } from './building-maintenance-api-gateway.module'
import { HttpExceptionFilter } from './exception-filters/http-exception.filter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(BuildingMaintenanceApiGatewayModule)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:5173']
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  })
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  

  app.useGlobalFilters(new HttpExceptionFilter())
//  app.useGlobalFilters(new RpcToHttpExceptionFilter())
 // console.log("🚀 ~ bootstrap ~ process.env.port:", process.env.port)
//  await app.listen(process.env.port ?? 3000)
//   const config = new DocumentBuilder()
//     .setTitle('API Example')
//     .setDescription('The API description')
//     .setVersion('1.0')
//     .addTag('users')
//     .build();

//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);  // Đường dẫn /api sẽ hiển thị Swagger UI

//   await app.listen(3000);
//   console.log(`Application is running on: http://localhost:3000/api`);
}
bootstrap()
