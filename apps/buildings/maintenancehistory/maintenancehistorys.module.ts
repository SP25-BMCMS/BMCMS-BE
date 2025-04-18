import { Module } from '@nestjs/common';
import { MaintenancehistorysService } from './maintenancehistorys.service';
import { MaintenancehistorysController } from './maintenancehistorys.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MaintenancehistorysController],
    providers: [MaintenancehistorysService],
    exports: [MaintenancehistorysService]
})
export class MaintenancehistorysModule { }
