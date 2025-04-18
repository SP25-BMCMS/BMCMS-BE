import { Injectable, Logger } from '@nestjs/common';
import { Device } from '@prisma/client-building';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDeviceDto } from '@app/contracts/Device/update-Device.dto';
import { CreateDeviceDto } from '@app/contracts/Device/create-Device.dto';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    try {
      this.logger.log(`Creating device: ${JSON.stringify(createDeviceDto)}`);
      const device = await this.prisma.device.create({
        data: createDeviceDto,
      });
      this.logger.log(`Device created successfully: ${device.device_id}`);
      return device;
    } catch (error) {
      this.logger.error(`Error creating device: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Device[]> {
    try {
      this.logger.log('Finding all devices');
      const devices = await this.prisma.device.findMany();
      this.logger.log(`Found ${devices.length} devices`);
      return devices;
    } catch (error) {
      this.logger.error(`Error finding all devices: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Device> {
    try {
      this.logger.log(`Finding device with id: ${id}`);
      const device = await this.prisma.device.findUnique({
        where: { device_id: id },
      });
      if (!device) {
        this.logger.warn(`Device not found with id: ${id}`);
        throw new Error('Device not found');
      }
      this.logger.log(`Device found: ${device.device_id}`);
      return device;
    } catch (error) {
      this.logger.error(`Error finding device: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    try {
      this.logger.log(`Updating device with id: ${id}`);
      const device = await this.prisma.device.update({
        where: { device_id: id },
        data: updateDeviceDto,
      });
      this.logger.log(`Device updated successfully: ${device.device_id}`);
      return device;
    } catch (error) {
      this.logger.error(`Error updating device: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<Device> {
    try {
      this.logger.log(`Removing device with id: ${id}`);
      const device = await this.prisma.device.delete({
        where: { device_id: id },
      });
      this.logger.log(`Device removed successfully: ${device.device_id}`);
      return device;
    } catch (error) {
      this.logger.error(`Error removing device: ${error.message}`);
      throw error;
    }
  }

  async getByBuildingDetailId(buildingDetailId: string): Promise<Device[]> {
    try {
      this.logger.log(`Finding devices by building detail id: ${buildingDetailId}`);
      const devices = await this.prisma.device.findMany({
        where: { buildingDetailId },
      });
      this.logger.log(`Found ${devices.length} devices for building detail: ${buildingDetailId}`);
      return devices;
    } catch (error) {
      this.logger.error(`Error finding devices by building detail: ${error.message}`);
      throw error;
    }
  }

  async getByContractId(contractId: string): Promise<Device[]> {
    try {
      this.logger.log(`Finding devices by contract id: ${contractId}`);
      const devices = await this.prisma.device.findMany({
        where: { contract_id: contractId },
      });
      this.logger.log(`Found ${devices.length} devices for contract: ${contractId}`);
      return devices;
    } catch (error) {
      this.logger.error(`Error finding devices by contract: ${error.message}`);
      throw error;
    }
  }
} 