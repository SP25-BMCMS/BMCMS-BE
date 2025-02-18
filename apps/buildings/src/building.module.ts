import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import {  BuildingsModule } from '../buildings/buildings.module';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    BuildingsModule,
    PrismaModule,],
})
export class BuildingModule {}
