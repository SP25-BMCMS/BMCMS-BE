import { Module } from '@nestjs/common';
import { RepairMaterialsService as RepairMaterialsService } from './RepairMaterials.service';
import { RepairMaterialsController } from './RepairMaterials.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RepairMaterialsService],
  controllers: [RepairMaterialsController],
})
export class RepairMaterialsModule {}
