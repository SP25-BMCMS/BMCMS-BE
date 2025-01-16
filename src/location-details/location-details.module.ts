import { Module } from '@nestjs/common';
import { LocationDetailsService } from './location-details.service';
import { LocationDetailsController } from './location-details.controller';

@Module({
  controllers: [LocationDetailsController],
  providers: [LocationDetailsService],
})
export class LocationDetailsModule {}
