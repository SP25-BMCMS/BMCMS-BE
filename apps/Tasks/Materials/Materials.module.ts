import { Module } from '@nestjs/common';
import { MaterialsService } from './Materials.service';
import { MaterialsController } from './Materials.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MaterialsService],
  controllers: [MaterialsController],
  exports: [MaterialsService]
})
export class MaterialsModule {}
