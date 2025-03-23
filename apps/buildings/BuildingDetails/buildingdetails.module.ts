import { Module } from '@nestjs/common';
import { BuildingDetailsService } from './buildingdetails.service';
import { BuildingDetailsController } from './buildingdetails.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [PrismaModule],
  providers: [BuildingDetailsService],
  controllers: [BuildingDetailsController]
})
export class BuildingDetailsModule {}
