import { Module } from '@nestjs/common';
import { DeviceService } from './Device.service';
import { DeviceController } from './Device.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService, PrismaService],
  exports: [DeviceService],
})
export class DeviceModule {} 