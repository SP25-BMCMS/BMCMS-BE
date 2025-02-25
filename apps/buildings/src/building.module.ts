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
import { BuildingDetailsModule } from 'apps/buildings/BuildingDetails/buildingdetails.module';
import { BuildingDetailsController } from  'apps/buildings/BuildingDetails/buildingdetails.controller';
import { BuildingDetailsService } from  'apps/buildings/BuildingDetails/buildingdetails.service';
import { locationDetailsModulee } from '../LocationDetails/locationdetails.module';
import { LocationDetailsController } from '../LocationDetails/locationdetails.controller';
import { LocationDetailService } from '../LocationDetails/locationdetails.service';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    BuildingsModule,
    PrismaModule,
    AreasModule,
    BuildingDetailsModule,
    locationDetailsModulee
  ],
    controllers: [AreasController,BuildingsController,BuildingDetailsController,LocationDetailsController],
      providers: [AreasService,BuildingsService,BuildingDetailsService,LocationDetailService],
})
export class BuildingModule {}
