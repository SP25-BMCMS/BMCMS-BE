import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TechnicalRecordsService } from './technicalrecords.service';
import { CreateTechnicalRecordDto } from '@app/contracts/technicalrecord/create-technicalrecord.dto';
import { UpdateTechnicalRecordDto } from '@app/contracts/technicalrecord/update-technicalrecord.dto';
import { TECHNICALRECORD_PATTERN } from '@app/contracts/technicalrecord/technicalrecord.patterns';

@Controller('technical-records')
export class TechnicalRecordsController {
    private readonly logger = new Logger(TechnicalRecordsController.name);

    constructor(private readonly technicalRecordsService: TechnicalRecordsService) { }

    @MessagePattern(TECHNICALRECORD_PATTERN.CREATE)
    async create(@Payload() payload: { dto: CreateTechnicalRecordDto, file: any }) {
        try {
            this.logger.log(`Creating technical record: ${JSON.stringify(payload.dto)}`);

            this.logger.log(`File info: ${JSON.stringify({
                originalname: payload.file?.originalname,
                mimetype: payload.file?.mimetype,
                size: payload.file?.size,
                hasBuffer: !!payload.file?.buffer,
                bufferType: payload.file?.buffer ? typeof payload.file.buffer : 'none'
            })}`);

            return await this.technicalRecordsService.create(payload.dto, payload.file);
        } catch (error) {
            this.logger.error(`Error in create technical record: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.GET_ALL)
    async findAll(@Payload() data: { page?: number; limit?: number }) {
        try {
            const { page, limit } = data || {};
            this.logger.log(`Finding all technical records, page: ${page}, limit: ${limit}`);
            return await this.technicalRecordsService.findAll(page, limit);
        } catch (error) {
            this.logger.error(`Error in findAll technical records: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.GET_BY_ID)
    async findOne(@Payload() id: string) {
        try {
            this.logger.log(`Finding technical record by ID: ${id}`);
            return await this.technicalRecordsService.findOne(id);
        } catch (error) {
            this.logger.error(`Error in findOne technical record: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.GET_BY_DEVICE_ID)
    async findByDeviceId(@Payload() data: { deviceId: string; page?: number; limit?: number }) {
        try {
            const { deviceId, page, limit } = data;
            this.logger.log(`Finding technical records by device ID: ${deviceId}, page: ${page}, limit: ${limit}`);
            return await this.technicalRecordsService.findByDeviceId(deviceId, page, limit);
        } catch (error) {
            this.logger.error(`Error in findByDeviceId: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.GET_BY_BUILDING_ID)
    async findByBuildingId(@Payload() data: { buildingId: string; page?: number; limit?: number }) {
        try {
            const { buildingId, page, limit } = data;
            this.logger.log(`Finding technical records by building ID: ${buildingId}, page: ${page}, limit: ${limit}`);
            return await this.technicalRecordsService.findByBuildingId(buildingId, page, limit);
        } catch (error) {
            this.logger.error(`Error in findByBuildingId: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.UPDATE)
    async update(@Payload() data: { id: string; updateTechnicalRecordDto: UpdateTechnicalRecordDto; file?: any }) {
        try {
            const { id, updateTechnicalRecordDto, file } = data;
            this.logger.log(`Updating technical record ID: ${id}, data: ${JSON.stringify(updateTechnicalRecordDto)}`);

            if (file) {
                this.logger.log(`Update includes file: ${JSON.stringify({
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    hasBuffer: !!file.buffer,
                    bufferType: typeof file.buffer
                })}`);

                // Convert base64 string back to Buffer if needed
                if (typeof file.buffer === 'string') {
                    this.logger.log('Converting base64 string back to buffer');
                    file.buffer = Buffer.from(file.buffer, 'base64');
                }
            }

            return await this.technicalRecordsService.update(id, updateTechnicalRecordDto, file);
        } catch (error) {
            this.logger.error(`Error in update technical record: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.DELETE)
    async remove(@Payload() id: string) {
        try {
            this.logger.log(`Removing technical record ID: ${id}`);
            return await this.technicalRecordsService.remove(id);
        } catch (error) {
            this.logger.error(`Error in remove technical record: ${error.message}`, error.stack);
            throw error;
        }
    }

    @MessagePattern(TECHNICALRECORD_PATTERN.UPLOAD_FILE)
    async uploadFile(@Payload() data: { file: Express.Multer.File; record_id?: string }) {
        try {
            const { file, record_id } = data;
            this.logger.log(`Uploading file for technical record: ${record_id || 'new record'}, filename: ${file.originalname}`);
            return await this.technicalRecordsService.uploadFile(file, record_id);
        } catch (error) {
            this.logger.error(`Error in uploading file for technical record: ${error.message}`, error.stack);
            throw error;
        }
    }
}
