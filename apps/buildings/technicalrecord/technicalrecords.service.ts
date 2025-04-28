import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicalRecordDto } from '@app/contracts/technicalrecord/create-technicalrecord.dto';
import { UpdateTechnicalRecordDto } from '@app/contracts/technicalrecord/update-technicalrecord.dto';
import { Prisma } from '@prisma/client-building';
import { RpcException } from '@nestjs/microservices';
import { S3UploaderService } from './s3-uploader.service';

@Injectable()
export class TechnicalRecordsService {
    private readonly logger = new Logger(TechnicalRecordsService.name);

    constructor(
        private prisma: PrismaService,
        private s3UploaderService: S3UploaderService
    ) { }

    async create(createTechnicalRecordDto: CreateTechnicalRecordDto, file: any) {
        try {
            // Check input data
            this.logger.log(`Creating technical record with data:`);
            this.logger.log(`Object:`, {
                dto: createTechnicalRecordDto,
                fileInfo: file ? {
                    originalname: file?.originalname,
                    mimetype: file?.mimetype,
                    size: file?.size,
                    bufferType: typeof file?.buffer
                } : null
            });

            let s3Url = '';

            // Nếu đã có file_url từ gateway, sử dụng luôn
            if (createTechnicalRecordDto.file_url) {
                s3Url = createTechnicalRecordDto.file_url;
                this.logger.log(`Using existing file URL: ${s3Url}`);
            }
            // Nếu không có sẵn file_url nhưng có file, upload lên S3
            else if (file && file.buffer) {
                this.logger.log(`Uploading file to S3...`);
                s3Url = await this.s3UploaderService.uploadFile(file);
                this.logger.log(`File uploaded successfully to S3: ${s3Url}`);
            } else {
                throw new RpcException({
                    message: 'Cần có file hoặc file_url',
                    statusCode: 400
                });
            }

            // Check if device exists
            const device = await this.prisma.device.findUnique({
                where: { device_id: createTechnicalRecordDto.device_id }
            });

            if (!device) {
                throw new RpcException({
                    message: `Không tìm thấy thiết bị với ID ${createTechnicalRecordDto.device_id}`,
                    statusCode: 404
                });
            }

            // Create the technical record with the file reference
            const newRecord = await this.prisma.technicalRecord.create({
                data: {
                    device_id: createTechnicalRecordDto.device_id,
                    file_name: s3Url,
                    file_type: createTechnicalRecordDto.file_type,
                    upload_date: new Date()
                },
                include: {
                    device: {
                        select: {
                            name: true,
                            type: true,
                            buildingDetail: {
                                select: {
                                    buildingDetailId: true,
                                    name: true,
                                    building: {
                                        select: {
                                            buildingId: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return {
                statusCode: 201,
                message: 'Tạo hồ sơ kỹ thuật thành công',
                data: newRecord
            };
        } catch (error) {
            this.logger.error(`Error in create technical record: ${error.message}`, error.stack);
            this.handlePrismaError(error);
        }
    }

    async findAll(page?: number, limit?: number) {
        try {
            // Nếu page hoặc limit không được cung cấp, sử dụng giá trị mặc định
            const skip = page ? (page - 1) * (limit || 10) : 0;
            const take = limit || (page ? 10 : undefined); // Nếu có page mà không có limit, dùng 10. Nếu không có page, không giới hạn.

            // Truy vấn dữ liệu
            const [records, total] = await Promise.all([
                this.prisma.technicalRecord.findMany({
                    skip: skip,
                    ...(take && { take }), // Chỉ áp dụng take nếu được cung cấp
                    include: {
                        device: {
                            select: {
                                device_id: true,
                                name: true,
                                type: true,
                                buildingDetail: {
                                    select: {
                                        buildingDetailId: true,
                                        name: true,
                                        building: {
                                            select: {
                                                buildingId: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        upload_date: 'desc'
                    }
                }),
                this.prisma.technicalRecord.count()
            ]);

            // Enhance records with URLs for direct access, download, and viewing
            const enhancedRecords = records.map(record => {
                if (record.file_name) {
                    return {
                        ...record,
                        directFileUrl: record.file_name, // Direct S3 URL
                        fileUrl: record.file_name,       // Will be used for downloading
                        viewUrl: record.file_name        // Will be used for inline viewing
                    };
                }
                return record;
            });

            return {
                data: enhancedRecords,
                meta: {
                    total,
                    page: page || 1,
                    limit: take || total,
                    totalPages: take ? Math.ceil(total / take) : 1
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findOne(id: string) {
        try {
            const technicalRecord = await this.prisma.technicalRecord.findUnique({
                where: { record_id: id },
                include: {
                    device: {
                        select: {
                            device_id: true,
                            name: true,
                            type: true,
                            buildingDetail: {
                                select: {
                                    buildingDetailId: true,
                                    name: true,
                                    building: {
                                        select: {
                                            buildingId: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!technicalRecord) {
                throw new RpcException({
                    message: `Không tìm thấy hồ sơ kỹ thuật với ID ${id}`,
                    statusCode: HttpStatus.NOT_FOUND
                });
            }

            return technicalRecord;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByDeviceId(deviceId: string, page?: number, limit?: number) {
        try {
            // Check if device exists
            const device = await this.prisma.device.findUnique({
                where: { device_id: deviceId }
            });

            if (!device) {
                throw new RpcException({
                    message: `Không tìm thấy thiết bị với ID ${deviceId}`,
                    statusCode: HttpStatus.NOT_FOUND
                });
            }

            // Nếu page hoặc limit không được cung cấp, sử dụng giá trị mặc định
            const skip = page ? (page - 1) * (limit || 10) : 0;
            const take = limit || (page ? 10 : undefined); // Nếu có page mà không có limit, dùng 10. Nếu không có page, không giới hạn.

            const [records, total] = await Promise.all([
                this.prisma.technicalRecord.findMany({
                    where: {
                        device_id: deviceId
                    },
                    skip: skip,
                    ...(take && { take }), // Chỉ áp dụng take nếu được cung cấp
                    include: {
                        device: {
                            select: {
                                device_id: true,
                                name: true,
                                type: true,
                                buildingDetail: {
                                    select: {
                                        buildingDetailId: true,
                                        name: true,
                                        building: {
                                            select: {
                                                buildingId: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        upload_date: 'desc'
                    }
                }),
                this.prisma.technicalRecord.count({
                    where: {
                        device_id: deviceId
                    }
                })
            ]);

            // Enhance records with URLs for direct access, download, and viewing
            const enhancedRecords = records.map(record => {
                if (record.file_name) {
                    return {
                        ...record,
                        directFileUrl: record.file_name, // Direct S3 URL
                        fileUrl: record.file_name,       // Will be used for downloading
                        viewUrl: record.file_name        // Will be used for inline viewing
                    };
                }
                return record;
            });

            return {
                data: enhancedRecords,
                meta: {
                    total,
                    page: page || 1,
                    limit: take || total,
                    totalPages: take ? Math.ceil(total / take) : 1
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByBuildingId(buildingId: string, page?: number, limit?: number) {
        try {
            // Check if building exists
            const building = await this.prisma.building.findUnique({
                where: { buildingId }
            });

            if (!building) {
                throw new RpcException({
                    message: `Không tìm thấy tòa nhà với ID ${buildingId}`,
                    statusCode: HttpStatus.NOT_FOUND
                });
            }

            // Nếu page hoặc limit không được cung cấp, sử dụng giá trị mặc định
            const skip = page ? (page - 1) * (limit || 10) : 0;
            const take = limit || (page ? 10 : undefined); // Nếu có page mà không có limit, dùng 10. Nếu không có page, không giới hạn.

            // First, get all devices in the building
            const buildingDevices = await this.prisma.device.findMany({
                where: {
                    buildingDetail: {
                        building: {
                            buildingId: buildingId
                        }
                    }
                },
                select: {
                    device_id: true
                }
            });

            if (buildingDevices.length === 0) {
                return {
                    data: [],
                    meta: {
                        total: 0,
                        page: page || 1,
                        limit: take || 0,
                        totalPages: 0
                    }
                };
            }

            const deviceIds = buildingDevices.map(device => device.device_id);

            // Then get technical records for these devices
            const [records, total] = await Promise.all([
                this.prisma.technicalRecord.findMany({
                    where: {
                        device_id: {
                            in: deviceIds
                        }
                    },
                    skip: skip,
                    ...(take && { take }), // Chỉ áp dụng take nếu được cung cấp
                    include: {
                        device: {
                            select: {
                                device_id: true,
                                name: true,
                                type: true,
                                buildingDetail: {
                                    select: {
                                        buildingDetailId: true,
                                        name: true,
                                        building: {
                                            select: {
                                                buildingId: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        upload_date: 'desc'
                    }
                }),
                this.prisma.technicalRecord.count({
                    where: {
                        device_id: {
                            in: deviceIds
                        }
                    }
                })
            ]);

            // Enhance records with URLs for direct access, download, and viewing
            const enhancedRecords = records.map(record => {
                if (record.file_name) {
                    return {
                        ...record,
                        directFileUrl: record.file_name, // Direct S3 URL
                        fileUrl: record.file_name,       // Will be used for downloading
                        viewUrl: record.file_name        // Will be used for inline viewing
                    };
                }
                return record;
            });

            return {
                data: enhancedRecords,
                meta: {
                    total,
                    page: page || 1,
                    limit: take || total,
                    totalPages: take ? Math.ceil(total / take) : 1
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async update(id: string, updateTechnicalRecordDto: UpdateTechnicalRecordDto, file?: any) {
        try {
            this.logger.log(`Updating technical record ID: ${id}`);
            this.logger.log(`Update data:`, {
                dto: updateTechnicalRecordDto,
                fileInfo: file ? {
                    originalname: file?.originalname,
                    mimetype: file?.mimetype,
                    size: file?.size,
                    hasBuffer: !!file?.buffer
                } : null
            });

            // Check if technical record exists
            const existingRecord = await this.prisma.technicalRecord.findUnique({
                where: { record_id: id }
            });

            if (!existingRecord) {
                throw new RpcException({
                    message: `Không tìm thấy hồ sơ kỹ thuật với ID ${id}`,
                    statusCode: 404
                });
            }

            // If device_id is provided in update, check if device exists
            if (updateTechnicalRecordDto.device_id) {
                const device = await this.prisma.device.findUnique({
                    where: { device_id: updateTechnicalRecordDto.device_id }
                });

                if (!device) {
                    throw new RpcException({
                        message: `Không tìm thấy thiết bị với ID ${updateTechnicalRecordDto.device_id}`,
                        statusCode: HttpStatus.NOT_FOUND
                    });
                }
            }

            const data: any = {};

            if (updateTechnicalRecordDto.device_id) {
                data.device_id = updateTechnicalRecordDto.device_id;
            }

            // Upload file và lấy URL nếu có file mới
            if (file) {
                this.logger.log(`Processing file for technical record ID: ${id}`);

                try {
                    // Make sure file has the required structure for S3 upload
                    if (!file.buffer && file.base64String) {
                        this.logger.log(`Converting base64 string to buffer`);
                        file.buffer = Buffer.from(file.base64String, 'base64');
                    }

                    if (!file.buffer) {
                        throw new Error('Không có bộ đệm file để tải lên');
                    }

                    const s3Url = await this.s3UploaderService.uploadFile(file);
                    data.file_name = s3Url;
                    data.file_type = updateTechnicalRecordDto.file_type || file.mimetype || existingRecord.file_type;
                    this.logger.log(`New file uploaded with URL: ${s3Url}`);
                } catch (uploadError) {
                    this.logger.error(`Error uploading file: ${uploadError.message}`, uploadError.stack);
                    throw new RpcException({
                        message: `Không thể tải lên file: ${uploadError.message}`,
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
                    });
                }
            } else if (updateTechnicalRecordDto.file_url) {
                // If file_url is provided directly, use it
                this.logger.log(`Using provided file URL for technical record ID: ${id}`);
                data.file_name = updateTechnicalRecordDto.file_url;

                if (updateTechnicalRecordDto.file_type) {
                    data.file_type = updateTechnicalRecordDto.file_type;
                }
            } else {
                // Cập nhật thông tin file nếu được cung cấp mà không có file mới
                if (updateTechnicalRecordDto.file_name) {
                    data.file_name = updateTechnicalRecordDto.file_name;
                }

                if (updateTechnicalRecordDto.file_type) {
                    data.file_type = updateTechnicalRecordDto.file_type;
                }
            }

            // Always update the upload_date when updating the record
            data.upload_date = new Date();

            this.logger.log(`Updating technical record with data:`, data);

            return this.prisma.technicalRecord.update({
                where: { record_id: id },
                data,
                include: {
                    device: {
                        select: {
                            name: true,
                            type: true,
                            buildingDetail: {
                                select: {
                                    name: true,
                                    building: {
                                        select: {
                                            buildingId: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.error(`Error in update technical record: ${error.message}`, error.stack);
            this.handlePrismaError(error);
        }
    }

    async remove(id: string) {
        try {
            // Check if technical record exists
            const existingRecord = await this.prisma.technicalRecord.findUnique({
                where: { record_id: id }
            });

            if (!existingRecord) {
                throw new RpcException({
                    message: `Không tìm thấy hồ sơ kỹ thuật với ID ${id}`,
                    statusCode: HttpStatus.NOT_FOUND
                });
            }

            return this.prisma.technicalRecord.delete({
                where: { record_id: id }
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async uploadFile(file: Express.Multer.File, recordId?: string) {
        try {
            // Upload file to S3
            const s3Url = await this.s3UploaderService.uploadFile(file);
            const fileName = file.originalname;
            const fileType = fileName.split('.').pop() || 'unknown';

            if (recordId) {
                // Update existing record
                return this.update(recordId, {
                    file_name: fileName,
                    file_type: fileType
                });
            } else {
                // Return file information
                return {
                    file_name: fileName,
                    file_type: fileType,
                    file_url: s3Url
                };
            }
        } catch (error) {
            this.logger.error(`Error uploading file: ${error.message}`, error.stack);
            throw new RpcException({
                message: `Không thể tải lên file: ${error.message}`,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR
            });
        }
    }

    private handlePrismaError(error: any) {
        this.logger.error(`Database error: ${error.message}`, error.stack);

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Foreign key constraint violation
            if (error.code === 'P2003') {
                throw new RpcException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Vi phạm ràng buộc khóa ngoại. Bản ghi tham chiếu không tồn tại.',
                    error: error.message
                });
            }

            // Unique constraint violation
            if (error.code === 'P2002') {
                throw new RpcException({
                    statusCode: HttpStatus.CONFLICT,
                    message: 'Đã tồn tại bản ghi với giá trị này.',
                    error: error.message
                });
            }

            // Record not found
            if (error.code === 'P2001' || error.code === 'P2025') {
                throw new RpcException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Không tìm thấy bản ghi.',
                    error: error.message
                });
            }
        }

        // Prisma validation error
        if (error instanceof Prisma.PrismaClientValidationError) {
            throw new RpcException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Lỗi xác thực trong truy vấn cơ sở dữ liệu.',
                error: error.message
            });
        }

        // If already an RpcException, ensure it has statusCode
        if (error instanceof RpcException) {
            const errorResponse = error.getError();

            if (typeof errorResponse === 'object') {
                const errorObj = errorResponse as Record<string, any>;

                if (!errorObj.statusCode) {
                    if (errorObj.message &&
                        (errorObj.message.includes('not found') ||
                            errorObj.message.includes('Not Found'))) {
                        throw new RpcException({
                            statusCode: HttpStatus.NOT_FOUND,
                            message: errorObj.message,
                            error: errorObj.error || 'Không tìm thấy'
                        });
                    } else if (errorObj.message &&
                        (errorObj.message.includes('invalid') ||
                            errorObj.message.includes('Invalid') ||
                            errorObj.message.includes('constraint'))) {
                        throw new RpcException({
                            statusCode: HttpStatus.BAD_REQUEST,
                            message: errorObj.message,
                            error: errorObj.error || 'Yêu cầu không hợp lệ'
                        });
                    } else {
                        throw new RpcException({
                            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: errorObj.message || 'Đã xảy ra lỗi',
                            error: errorObj.error || 'Lỗi máy chủ nội bộ'
                        });
                    }
                }
            }

            throw error;
        }

        // Unhandled error
        throw new RpcException({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Đã xảy ra lỗi không mong muốn.',
            error: error.message
        });
    }
}
