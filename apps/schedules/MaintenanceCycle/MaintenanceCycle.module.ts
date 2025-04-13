import { Module } from '@nestjs/common';
import { MaintenanceCycleController } from './MaintenanceCycle.controller';
import { MaintenanceCycleService } from './MaintenanceCycle.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceCycleController],
  providers: [MaintenanceCycleService],
  exports: [MaintenanceCycleService],
})
export class MaintenanceCycleModule {} 