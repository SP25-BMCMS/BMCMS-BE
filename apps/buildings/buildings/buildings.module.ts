import { Module } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [PrismaModule],
  providers: [BuildingsService],
  controllers: [BuildingsController]
})
export class BuildingsModule {}
