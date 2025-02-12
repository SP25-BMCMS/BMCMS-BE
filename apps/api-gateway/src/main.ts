import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { BuildingMaintenanceApiGatewayModule } from './building-maintenance-api-gateway.module'
import { RpcToHttpExceptionFilter } from './exception-filters/rpc-to-http-exception.filter'
import { HttpExceptionFilter } from './exception-filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(BuildingMaintenanceApiGatewayModule)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalFilters(new RpcToHttpExceptionFilter())
  await app.listen(process.env.port ?? 3000)
}
bootstrap()
