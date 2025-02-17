import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { BuildingMaintenanceApiGatewayModule } from './building-maintenance-api-gateway.module'
import { RpcToHttpExceptionFilter } from './exception-filters/rpc-to-http-exception.filter'
import { HttpExceptionFilter } from './exception-filters/http-exception.filter'

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
  }))
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalFilters(new RpcToHttpExceptionFilter())
  await app.listen(process.env.port ?? 3000)
}
bootstrap()
