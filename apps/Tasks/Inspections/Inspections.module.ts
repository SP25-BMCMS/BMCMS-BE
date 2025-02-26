import { Module } from '@nestjs/common';
import { InspectionsService } from './Inspections.service';
import { InspectionsController } from './Inspections.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  providers: [InspectionsService],
  controllers: [InspectionsController]
})
export class InspectionsModule {}
