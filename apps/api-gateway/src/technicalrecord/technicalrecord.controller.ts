import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    HttpException,
    HttpStatus,
    Res,
    Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TechnicalRecordService } from './technicalrecord.service';
import { CreateTechnicalRecordDto } from '@app/contracts/technicalrecord/create-technicalrecord.dto';
import { UpdateTechnicalRecordDto } from '@app/contracts/technicalrecord/update-technicalrecord.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard';
import { Response } from 'express';

@ApiTags('Technical Records')
@Controller('technical-records')
@ApiBearerAuth()
export class TechnicalRecordController {
    constructor(private readonly technicalRecordService: TechnicalRecordService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new technical record with file upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                device_id: {
                    type: 'string',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                    description: 'Device ID that this technical record belongs to'
                },
                file_type: {
                    type: 'string',
                    example: 'manual',
                    description: 'Type of technical document'
                },
                recordFile: {
                    type: 'string',
                    format: 'binary',
                    description: 'Technical record file (PDF only, maximum 10MB)'
                }
            },
            required: ['device_id', 'recordFile']
        }
    })
    @UseInterceptors(
        FileInterceptor('recordFile', {
            fileFilter: (req, file, callback) => {
                console.log('File upload attempt:', {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });

                const allowedMimeTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png'
                ];

                if (allowedMimeTypes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    console.error('Invalid file type:', file.mimetype);
                    callback(
                        new HttpException(
                            {
                                statusCode: HttpStatus.BAD_REQUEST,
                                message: 'Only PDF, JPEG, and PNG files are allowed'
                            },
                            HttpStatus.BAD_REQUEST
                        ),
                        false
                    );
                }
            }
        })
    )
    async create(
        @Body() createTechnicalRecordDto: CreateTechnicalRecordDto,
        @UploadedFile() file: Express.Multer.File
    ) {
        try {
            console.log('Creating technical record with data:', {
                dto: createTechnicalRecordDto,
                fileInfo: file ? {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                } : null
            });

            if (!file) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'Technical record file is required'
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            // Process file for microservice transport
            const processedFile = {
                ...file,
                buffer: file.buffer.toString('base64') // Convert buffer to base64 string for transport
            };

            console.log('Sending request to microservice with file info:', {
                originalname: processedFile.originalname,
                mimetype: processedFile.mimetype,
                size: processedFile.size,
                bufferType: typeof processedFile.buffer,
                bufferLength: processedFile.buffer.length
            });

            createTechnicalRecordDto.file_name = file.originalname;

            console.log('Sending request to microservice...');
            return await this.technicalRecordService.create(createTechnicalRecordDto, processedFile);
        } catch (error) {
            console.error('Error in controller:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all technical records with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (optional)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page (optional)' })
    async findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        try {
            console.log(`Finding all technical records, page: ${page}, limit: ${limit}`);
            const result = await this.technicalRecordService.findAll(page, limit);
            return result;
        } catch (error) {
            console.error('Error getting technical records:', error);
            throw error;
        }
    }

    @Get('by-device/:deviceId')
    @ApiOperation({ summary: 'Get technical records by device ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (optional)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page (optional)' })
    async findByDeviceId(
        @Param('deviceId') deviceId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        try {
            console.log(`Finding technical records for device: ${deviceId}, page: ${page}, limit: ${limit}`);
            const result = await this.technicalRecordService.findByDeviceId(deviceId, page, limit);
            return result;
        } catch (error) {
            console.error('Error getting technical records by device ID:', error);
            throw error;
        }
    }

    @Get('by-building/:buildingId')
    @ApiOperation({ summary: 'Get technical records by building ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (optional)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page (optional)' })
    async findByBuildingId(
        @Param('buildingId') buildingId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        try {
            console.log(`Finding technical records for building: ${buildingId}, page: ${page}, limit: ${limit}`);
            const result = await this.technicalRecordService.findByBuildingId(buildingId, page, limit);
            return result;
        } catch (error) {
            console.error('Error getting technical records by building ID:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a technical record by ID' })
    async findOne(@Param('id') id: string) {
        try {
            const result = await this.technicalRecordService.findOne(id);
            // Các URL đã được tạo từ service, không cần xử lý ở đây nữa
            return result;
        } catch (error) {
            console.error('Error getting technical record:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a technical record' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                device_id: {
                    type: 'string',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                    description: 'Device ID that this technical record belongs to'
                },
                file_type: {
                    type: 'string',
                    example: 'manual',
                    description: 'Type of technical document'
                },
                recordFile: {
                    type: 'string',
                    format: 'binary',
                    description: 'Technical record file (PDF, JPEG, PNG) (optional)'
                }
            }
        }
    })
    @UseInterceptors(
        FileInterceptor('recordFile', {
            fileFilter: (req, file, callback) => {
                console.log('File update attempt:', {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });

                const allowedMimeTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png'
                ];

                if (allowedMimeTypes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    console.error('Invalid file type:', file.mimetype);
                    callback(
                        new HttpException(
                            {
                                statusCode: HttpStatus.BAD_REQUEST,
                                message: 'Only PDF, JPEG, and PNG files are allowed'
                            },
                            HttpStatus.BAD_REQUEST
                        ),
                        false
                    );
                }
            }
        })
    )
    async update(
        @Param('id') id: string,
        @Body() updateTechnicalRecordDto: UpdateTechnicalRecordDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        try {
            console.log('Updating technical record with data:', {
                id,
                dto: updateTechnicalRecordDto,
                fileInfo: file ? {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                } : null
            });

            let processedFile = null;

            // Xử lý file nếu có
            if (file) {
                // Process file for microservice transport
                processedFile = {
                    ...file,
                    buffer: file.buffer.toString('base64') // Convert buffer to base64 string for transport
                };

                console.log('Including file in update:', {
                    originalname: processedFile.originalname,
                    mimetype: processedFile.mimetype,
                    size: processedFile.size,
                });

                // Cập nhật tên file nếu có file mới
                updateTechnicalRecordDto.file_name = file.originalname;
            }

            return await this.technicalRecordService.update(id, updateTechnicalRecordDto, processedFile);
        } catch (error) {
            console.error('Error updating technical record:', error);
            throw error;
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a technical record' })
    async remove(@Param('id') id: string) {
        return this.technicalRecordService.remove(id);
    }
} 