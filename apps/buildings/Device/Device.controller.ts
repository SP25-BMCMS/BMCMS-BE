import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DeviceService } from './Device.service';
import { CreateDeviceDto } from '@app/contracts/Device/create-Device.dto';
import { DEVICE_PATTERNS } from '@app/contracts/Device/Device.patterns';
import { UpdateDeviceDto } from '@app/contracts/Device/update-Device.dto';

@Controller()
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @MessagePattern(DEVICE_PATTERNS.CREATE)
  async create(createDeviceDto: CreateDeviceDto) {
    try {
      this.logger.log(`Received create device request: ${JSON.stringify(createDeviceDto)}`);
      return await this.deviceService.create(createDeviceDto);
    } catch (error) {
      this.logger.error(`Error in create device: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.FIND_ALL)
  async findAll() {
    try {
      this.logger.log('Received find all devices request');
      return await this.deviceService.findAll();
    } catch (error) {
      this.logger.error(`Error in find all devices: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.FIND_ONE)
  async findOne(id: string) {
    try {
      this.logger.log(`Received find one device request for id: ${id}`);
      return await this.deviceService.findOne(id);
    } catch (error) {
      this.logger.error(`Error in find one device: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.UPDATE)
  async update(data: { id: string; updateDeviceDto: UpdateDeviceDto }) {
    try {
      this.logger.log(`Received update device request for id: ${data.id}`);
      return await this.deviceService.update(data.id, data.updateDeviceDto);
    } catch (error) {
      this.logger.error(`Error in update device: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.DELETE)
  async remove(id: string) {
    try {
      this.logger.log(`Received remove device request for id: ${id}`);
      return await this.deviceService.remove(id);
    } catch (error) {
      this.logger.error(`Error in remove device: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.GET_BY_BUILDING_DETAIL)
  async getByBuildingDetailId(buildingDetailId: string) {
    try {
      this.logger.log(`Received get devices by building detail request for id: ${buildingDetailId}`);
      return await this.deviceService.getByBuildingDetailId(buildingDetailId);
    } catch (error) {
      this.logger.error(`Error in get devices by building detail: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern(DEVICE_PATTERNS.GET_BY_CONTRACT)
  async getByContractId(contractId: string) {
    try {
      this.logger.log(`Received get devices by contract request for id: ${contractId}`);
      return await this.deviceService.getByContractId(contractId);
    } catch (error) {
      this.logger.error(`Error in get devices by contract: ${error.message}`);
      throw error;
    }
  }
} 