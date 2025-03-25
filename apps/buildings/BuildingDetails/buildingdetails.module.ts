import { Module } from '@nestjs/common';
import { BuildingDetailsController } from './buildingdetails.controller';
import { BuildingDetailsService } from './buildingdetails.service';
import { PrismaModule } from '../../users/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BuildingDetailsController],
  providers: [BuildingDetailsService],
})
export class BuildingDetailsModule {}
