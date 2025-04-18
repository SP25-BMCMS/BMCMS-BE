import { Injectable, Logger, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/create-maintenancehistory.dto';
import { UpdateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/update-maintenancehistory.dto';
import { Prisma } from '@prisma/client-building';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class MaintenancehistorysService {
    private readonly logger = new Logger(MaintenancehistorysService.name);

    constructor(private prisma: PrismaService) { }

    async create(createMaintenanceHistoryDto: CreateMaintenanceHistoryDto) {
        try {
            // Kiểm tra xem device_id có tồn tại không
            const device = await this.prisma.device.findUnique({
                where: { device_id: createMaintenanceHistoryDto.device_id }
            });

            if (!device) {
                throw new RpcException({
                    message: `Device with ID ${createMaintenanceHistoryDto.device_id} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            return this.prisma.maintenanceHistory.create({
                data: {
                    device_id: createMaintenanceHistoryDto.device_id,
                    date_performed: new Date(createMaintenanceHistoryDto.date_performed),
                    description: createMaintenanceHistoryDto.description,
                    cost: createMaintenanceHistoryDto.cost ? Number(createMaintenanceHistoryDto.cost) : null,
                }
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findAll(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.prisma.maintenanceHistory.findMany({
                    skip,
                    take: limit,
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
                }),
                this.prisma.maintenanceHistory.count()
            ]);

            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findOne(id: string) {
        try {
            const maintenanceHistory = await this.prisma.maintenanceHistory.findUnique({
                where: { maintenance_id: id },
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

            if (!maintenanceHistory) {
                throw new RpcException({
                    message: `Maintenance history with ID ${id} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            return maintenanceHistory;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByDeviceId(deviceId: string, page = 1, limit = 10) {
        try {
            // Kiểm tra xem device có tồn tại không
            const device = await this.prisma.device.findUnique({
                where: { device_id: deviceId }
            });

            if (!device) {
                throw new RpcException({
                    message: `Device with ID ${deviceId} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.prisma.maintenanceHistory.findMany({
                    where: {
                        device_id: deviceId
                    },
                    skip,
                    take: limit,
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
                }),
                this.prisma.maintenanceHistory.count({
                    where: {
                        device_id: deviceId
                    }
                })
            ]);

            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findByBuildingId(buildingId: string, page = 1, limit = 10) {
        try {
            // Kiểm tra xem building có tồn tại không
            const building = await this.prisma.building.findUnique({
                where: { buildingId }
            });

            if (!building) {
                throw new RpcException({
                    message: `Building with ID ${buildingId} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            const skip = (page - 1) * limit;

            // Trước tiên, lấy tất cả thiết bị trong tòa nhà
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
                        page,
                        limit,
                        totalPages: 0
                    }
                };
            }

            const deviceIds = buildingDevices.map(device => device.device_id);

            // Sau đó lấy lịch sử bảo trì cho các thiết bị này
            const [data, total] = await Promise.all([
                this.prisma.maintenanceHistory.findMany({
                    where: {
                        device_id: {
                            in: deviceIds
                        }
                    },
                    skip,
                    take: limit,
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
                }),
                this.prisma.maintenanceHistory.count({
                    where: {
                        device_id: {
                            in: deviceIds
                        }
                    }
                })
            ]);

            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async update(id: string, updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto) {
        try {
            // Kiểm tra xem maintenance history có tồn tại không
            const existingHistory = await this.prisma.maintenanceHistory.findUnique({
                where: { maintenance_id: id }
            });

            if (!existingHistory) {
                throw new RpcException({
                    message: `Maintenance history with ID ${id} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            // Nếu có device_id trong update, kiểm tra device có tồn tại không
            if (updateMaintenanceHistoryDto.device_id) {
                const device = await this.prisma.device.findUnique({
                    where: { device_id: updateMaintenanceHistoryDto.device_id }
                });

                if (!device) {
                    throw new RpcException({
                        message: `Device with ID ${updateMaintenanceHistoryDto.device_id} not found`,
                        status: HttpStatus.NOT_FOUND
                    });
                }
            }

            const data: any = {};

            if (updateMaintenanceHistoryDto.device_id) {
                data.device_id = updateMaintenanceHistoryDto.device_id;
            }

            if (updateMaintenanceHistoryDto.date_performed) {
                data.date_performed = new Date(updateMaintenanceHistoryDto.date_performed);
            }

            if (updateMaintenanceHistoryDto.description !== undefined) {
                data.description = updateMaintenanceHistoryDto.description;
            }

            if (updateMaintenanceHistoryDto.cost !== undefined) {
                data.cost = Number(updateMaintenanceHistoryDto.cost);
            }

            return this.prisma.maintenanceHistory.update({
                where: { maintenance_id: id },
                data
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async remove(id: string) {
        try {
            // Kiểm tra xem maintenance history có tồn tại không
            const existingHistory = await this.prisma.maintenanceHistory.findUnique({
                where: { maintenance_id: id }
            });

            if (!existingHistory) {
                throw new RpcException({
                    message: `Maintenance history with ID ${id} not found`,
                    status: HttpStatus.NOT_FOUND
                });
            }

            return this.prisma.maintenanceHistory.delete({
                where: { maintenance_id: id }
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    private handlePrismaError(error: any) {
        this.logger.error(`Database error: ${error.message}`, error.stack);

        // Xử lý lỗi Prisma cụ thể
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Lỗi foreign key constraint
            if (error.code === 'P2003') {
                throw new RpcException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Foreign key constraint violation. The referenced record does not exist.',
                    error: error.message
                });
            }

            // Lỗi unique constraint
            if (error.code === 'P2002') {
                throw new RpcException({
                    statusCode: HttpStatus.CONFLICT,
                    message: 'A record with this value already exists.',
                    error: error.message
                });
            }

            // Lỗi not found
            if (error.code === 'P2001' || error.code === 'P2025') {
                throw new RpcException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'The record was not found.',
                    error: error.message
                });
            }
        }

        // Lỗi Prisma validation
        if (error instanceof Prisma.PrismaClientValidationError) {
            throw new RpcException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Validation error in database query.',
                error: error.message
            });
        }

        // Nếu đã là RpcException thì kiểm tra và đảm bảo có statusCode
        if (error instanceof RpcException) {
            // Lấy nội dung lỗi
            const errorResponse = error.getError();

            // Xử lý errorResponse để đảm bảo nó có cấu trúc đúng
            if (typeof errorResponse === 'object') {
                const errorObj = errorResponse as Record<string, any>;

                // Nếu không có statusCode, thêm vào
                if (!errorObj.statusCode) {
                    // Kiểm tra message để xác định statusCode
                    if (errorObj.message &&
                        (errorObj.message.includes('not found') ||
                            errorObj.message.includes('Not Found'))) {
                        throw new RpcException({
                            statusCode: HttpStatus.NOT_FOUND,
                            message: errorObj.message,
                            error: errorObj.error || 'Not Found'
                        });
                    } else if (errorObj.message &&
                        (errorObj.message.includes('invalid') ||
                            errorObj.message.includes('Invalid') ||
                            errorObj.message.includes('constraint'))) {
                        throw new RpcException({
                            statusCode: HttpStatus.BAD_REQUEST,
                            message: errorObj.message,
                            error: errorObj.error || 'Bad Request'
                        });
                    } else {
                        throw new RpcException({
                            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: errorObj.message || 'An error occurred',
                            error: errorObj.error || 'Internal Server Error'
                        });
                    }
                }
            }

            throw error;
        }

        // Lỗi không xác định
        throw new RpcException({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred.',
            error: error.message
        });
    }
}
