import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { BuildingMaintenanceApiGatewayModule } from './building-maintenance-api-gateway.module'
import { HttpExceptionFilter } from './exception-filters/http-exception.filter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(BuildingMaintenanceApiGatewayModule)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']
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
  const config = new DocumentBuilder()
    .setTitle('BMCMS - Building Management & Crack Monitoring System')
    .setDescription('API for managing buildings, monitoring cracks, and handling maintenance tasks')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    // .addTag('users', 'User management endpoints')
    .addTag('buildings', 'Building management endpoints')
    .addTag('areas', 'Area management endpoints')
    .addTag('cracks', 'Crack monitoring endpoints')
    .addTag('tasks', 'Task management endpoints')
    .addTag('schedules', 'Schedule management endpoints')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // Custom Swagger UI options
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
    },
    customSiteTitle: 'BMCMS API Documentation',
  }

  SwaggerModule.setup('api', app, document, customOptions)

  const PORT = process.env.PORT || 3000
  await app.listen(PORT)
  console.log(`Application is running on: ${await app.getUrl()}`)
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`)
}
bootstrap()
