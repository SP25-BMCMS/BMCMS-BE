import { Injectable, Logger } from '@nestjs/common';
import { Device } from '@prisma/client-building';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDeviceDto } from '@app/contracts/Device/update-Device.dto';
import { CreateDeviceDto } from '@app/contracts/Device/create-Device.dto';
import { RpcException } from '@nestjs/microservices';
import { DeviceType } from '@prisma/client-building';
@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto) {
    try {
      this.logger.log(`Creating device: ${JSON.stringify(createDeviceDto)}`);
      const device = await this.prisma.device.create({
        data: createDeviceDto,
      });
      this.logger.log(`Device created successfully: ${device.device_id}`);
      return {
        statusCode: 201,
        message: 'Device created successfully',
        data: device,
      };
    } catch (error) {
      this.logger.error(`Error creating device: ${error.message}`);
      throw new RpcException({
        statusCode: 400,
        message: 'Device creation failed: ' + error.message,
      });
    }
  }

  async findAll(params: { page?: number, limit?: number, type?: DeviceType, search?: string }) {
    console.log("🚀 ~ DeviceService ~ findAll ~ search:", params)
    try {
      const pageNum = Math.max(1, params?.page || 1);
      const limitNum = Math.min(50, Math.max(1, params?.limit || 10));
      const skip = (pageNum - 1) * limitNum;
      this.logger.log(`Finding all devices with search: ${params?.search || 'none'}`);
      
      
      const where = {
        ...(params?.search ? {
          name: {
            contains: params?.search,
            mode: 'insensitive' as const
          }
        } : {}),
        ...(params?.type ? { type: params?.type } : {})
      };
      
      const [devices, total] = await Promise.all([
        this.prisma.device.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: {
            device_id: 'desc'
          }
        }),
        this.prisma.device.count({ where })
      ]);
      
      this.logger.log(`Found ${devices.length} devices`);
      return {
        statusCode: 200,
        message: 'Devices retrieved successfully',
        data: devices,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      this.logger.error(`Error finding all devices: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving devices: ' + error.message,
      });
    }
  }

  async findOne(id: string) {
    try {
      this.logger.log(`Finding device with id: ${id}`);
      const device = await this.prisma.device.findUnique({
        where: { device_id: id },
      });
      if (!device) {
        this.logger.warn(`Device not found with id: ${id}`);
        throw new RpcException({
          statusCode: 404,
          message: 'Device not found',
        });
      }
      this.logger.log(`Device found: ${device.device_id}`);
      return {
        statusCode: 200,
        message: 'Device retrieved successfully',
        data: device,
      };
    } catch (error) {
      this.logger.error(`Error finding device: ${error.message}`);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving device: ' + error.message,
      });
    }
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    try {
      this.logger.log(`Updating device with id: ${id}`);
      const device = await this.prisma.device.update({
        where: { device_id: id },
        data: updateDeviceDto,
      });
      this.logger.log(`Device updated successfully: ${device.device_id}`);
      return {
        statusCode: 200,
        message: 'Device updated successfully',
        data: device,
      };
    } catch (error) {
      this.logger.error(`Error updating device: ${error.message}`);
      throw new RpcException({
        statusCode: 400,
        message: 'Device update failed: ' + error.message,
      });
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Removing device with id: ${id}`);
      const device = await this.prisma.device.delete({
        where: { device_id: id },
      });
      this.logger.log(`Device removed successfully: ${device.device_id}`);
      return {
        statusCode: 200,
        message: 'Device deleted successfully',
        data: device,
      };
    } catch (error) {
      this.logger.error(`Error removing device: ${error.message}`);
      throw new RpcException({
        statusCode: 400,
        message: 'Device deletion failed: ' + error.message,
      });
    }
  }

  async getByBuildingDetailId(buildingDetailId: string) {
    try {
      this.logger.log(`Finding devices by building detail id: ${buildingDetailId}`);
      const devices = await this.prisma.device.findMany({
        where: { buildingDetailId },
      });
      this.logger.log(`Found ${devices.length} devices for building detail: ${buildingDetailId}`);
      return {
        statusCode: 200,
        message: 'Devices retrieved successfully',
        data: devices,
      };
    } catch (error) {
      this.logger.error(`Error finding devices by building detail: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving devices by building detail: ' + error.message,
      });
    }
  }

  async getByContractId(contractId: string) {
    try {
      this.logger.log(`Finding devices by contract id: ${contractId}`);
      const devices = await this.prisma.device.findMany({
        where: { contract_id: contractId },
      });
      this.logger.log(`Found ${devices.length} devices for contract: ${contractId}`);
      return {
        statusCode: 200,
        message: 'Devices retrieved successfully',
        data: devices,
      };
    } catch (error) {
      this.logger.error(`Error finding devices by contract: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Error retrieving devices by contract: ' + error.message,
      });
    }
  }
} 