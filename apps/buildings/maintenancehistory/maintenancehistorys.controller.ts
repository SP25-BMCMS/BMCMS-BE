import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { MaintenancehistorysService } from './maintenancehistorys.service';
import { CreateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/create-maintenancehistory.dto';
import { UpdateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/update-maintenancehistory.dto';
import { MAINTENANCEHISTORY_PATTERN } from '@app/contracts/maintenancehistory/maintenancehistory.patterns';

@Controller('maintenance-history')
export class MaintenancehistorysController {
    private readonly logger = new Logger(MaintenancehistorysController.name);

    constructor(private readonly maintenancehistorysService: MaintenancehistorysService) { }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.CREATE)
    async create(@Payload() createMaintenanceHistoryDto: CreateMaintenanceHistoryDto) {
        try {
            this.logger.log(`Creating maintenance history: ${JSON.stringify(createMaintenanceHistoryDto)}`);
            return await this.maintenancehistorysService.create(createMaintenanceHistoryDto);
        } catch (error) {
            this.logger.error(`Error in createMaintenanceHistory: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.GET_ALL)
    async findAll(@Payload() data: { page?: number; limit?: number }) {
        try {
            const { page = 1, limit = 10 } = data;
            this.logger.log(`Finding all maintenance history, page: ${page}, limit: ${limit}`);
            return await this.maintenancehistorysService.findAll(page, limit);
        } catch (error) {
            this.logger.error(`Error in findAll maintenance history: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.GET_BY_ID)
    async findOne(@Payload() id: string) {
        try {
            this.logger.log(`Finding maintenance history by ID: ${id}`);
            return await this.maintenancehistorysService.findOne(id);
        } catch (error) {
            this.logger.error(`Error in findOne maintenance history: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.GET_BY_DEVICE_ID)
    async findByDeviceId(@Payload() data: { deviceId: string; page?: number; limit?: number }) {
        try {
            const { deviceId, page = 1, limit = 10 } = data;
            this.logger.log(`Finding maintenance history by device ID: ${deviceId}, page: ${page}, limit: ${limit}`);
            return await this.maintenancehistorysService.findByDeviceId(deviceId, page, limit);
        } catch (error) {
            this.logger.error(`Error in findByDeviceId: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.GET_BY_BUILDING_ID)
    async findByBuildingId(@Payload() data: { buildingId: string; page?: number; limit?: number }) {
        try {
            const { buildingId, page = 1, limit = 10 } = data;
            this.logger.log(`Finding maintenance history by building ID: ${buildingId}, page: ${page}, limit: ${limit}`);
            return await this.maintenancehistorysService.findByBuildingId(buildingId, page, limit);
        } catch (error) {
            this.logger.error(`Error in findByBuildingId: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.UPDATE)
    async update(@Payload() data: { id: string; updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto }) {
        try {
            const { id, updateMaintenanceHistoryDto } = data;
            this.logger.log(`Updating maintenance history ID: ${id}, data: ${JSON.stringify(updateMaintenanceHistoryDto)}`);
            return await this.maintenancehistorysService.update(id, updateMaintenanceHistoryDto);
        } catch (error) {
            this.logger.error(`Error in update maintenance history: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(MAINTENANCEHISTORY_PATTERN.DELETE)
    async remove(@Payload() id: string) {
        try {
            this.logger.log(`Removing maintenance history ID: ${id}`);
            return await this.maintenancehistorysService.remove(id);
        } catch (error) {
            this.logger.error(`Error in remove maintenance history: ${error.message}`, error.stack);
            throw error;
        }
    }
}
