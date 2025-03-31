import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { PrismaModule } from '../../users/prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  providers: [AreasService],
  controllers: [AreasController],
})
export class AreasModule {}
