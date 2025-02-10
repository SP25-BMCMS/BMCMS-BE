import { NestFactory } from '@nestjs/core'
import { BuildingMaintenanceApiGatewayModule } from './building-maintenance-api-gateway.module'
import { RpcToHttpExceptionFilter } from './exception-filters/rpc-to-http-exception.filter'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(BuildingMaintenanceApiGatewayModule)
  app.useGlobalFilters(new RpcToHttpExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  await app.listen(process.env.port ?? 3000)
}
bootstrap()
