import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientConfigModule } from 'apps/configs/client-config.module'
import { PrismaModule } from '../prisma/prisma.module'
import { BuildingsModule } from '../buildings/buildings.module'
import { AreasModule } from '../Areas/areas.module'
import { AreasController } from '../Areas/areas.controller'
import { AreasService } from '../Areas/areas.service'
import { BuildingDetailsModule } from 'apps/buildings/BuildingDetails/buildingdetails.module'
import { BuildingDetailsController } from 'apps/buildings/BuildingDetails/buildingdetails.controller'
import { BuildingDetailsService } from 'apps/buildings/BuildingDetails/buildingdetails.service'
import { LocationDetailsModule } from '../LocationDetails/locationdetails.module'
import { LocationDetailsController } from '../LocationDetails/locationdetails.controller'
import { ContractsModule } from '../contract/contracts.module'
import { ContractsController } from '../contract/contracts.controller'
import { ContractsService } from '../contract/contracts.service'
import { CrackRecordModule } from '../CrackRecord/CrackRecord.module'
import { CrackRecordController } from '../CrackRecord/CrackRecord.controller'
import { S3UploaderService } from '../contract/s3-uploader.service'
import { DeviceModule } from '../Device/Device.module'
import { DeviceController } from '../Device/Device.controller'
import { MaintenancehistorysModule } from '../maintenancehistory/maintenancehistorys.module'
import { TechnicalRecordsModule } from '../technicalrecord/technicalrecords.module'
import { TechnicalRecordsController } from '../technicalrecord/technicalrecords.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    BuildingsModule,
    PrismaModule,
    AreasModule,
    BuildingDetailsModule,
    LocationDetailsModule,
    ContractsModule,
    CrackRecordModule,
    MaintenancehistorysModule,
    DeviceModule,
    TechnicalRecordsModule,
  ],
  controllers: [
    AreasController,
    BuildingDetailsController,
    LocationDetailsController,
    ContractsController,
    CrackRecordController,
    LocationDetailsController,
    DeviceController,
    TechnicalRecordsController,
  ],
  providers: [
    AreasService,
    BuildingDetailsService,
    ContractsService,
    S3UploaderService,
  ],
})
export class BuildingModule { }
