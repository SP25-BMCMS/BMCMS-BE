import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import {  BuildingsModule } from '../buildings/buildings.module';
import {   AreasModule} from '../Areas/areas.module';
import { AreasController } from '../Areas/areas.controller';
import { AreasService } from '../Areas/areas.service';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    BuildingsModule,
    PrismaModule,
    AreasModule,
  ],
    // controllers: [AreasController,BuildingsController],
    //   providers: [AreasService,BuildingsService],
})
export class BuildingModule {}
