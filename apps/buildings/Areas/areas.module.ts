import {AreasService } from './areas.service';
import {AreasController } from './areas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [PrismaModule],
  providers: [AreasService],
  controllers: [AreasController],
})
export class AreasModule {}
