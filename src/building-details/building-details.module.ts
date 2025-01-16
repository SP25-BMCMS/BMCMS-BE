import { Module } from '@nestjs/common';
import { BuildingDetailsService } from './building-details.service';
import { BuildingDetailsController } from './building-details.controller';

@Module({
  controllers: [BuildingDetailsController],
  providers: [BuildingDetailsService],
})
export class BuildingDetailsModule {}
