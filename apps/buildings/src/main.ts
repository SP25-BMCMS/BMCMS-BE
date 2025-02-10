import { NestFactory } from '@nestjs/core';
import { BuildingsModule } from './buildings.module';

async function bootstrap() {
  const app = await NestFactory.create(BuildingsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
