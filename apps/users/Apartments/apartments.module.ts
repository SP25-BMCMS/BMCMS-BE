import { Module } from '@nestjs/common';
import { ApartmentsService as ApartmentsService } from './apartments.service';
import { ApartmentsController as ApartmentsController } from './apartments.controller';

@Module({
  controllers: [ApartmentsController],
  providers: [ApartmentsService],
})
export class ApartmentsModule {}
