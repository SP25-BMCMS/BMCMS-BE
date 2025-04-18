import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BUILDING_CLIENT } from '../constraints';
import { DEVICE_PATTERNS } from '@app/contracts/Device/Device.patterns';
import { CreateDeviceDto } from '@app/contracts/contracts/create-device.dto';
import { UpdateDeviceDto } from '@app/contracts/Device/update-Device.dto';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(@Inject(BUILDING_CLIENT) private readonly Deviceclient: ClientProxy) {}

  async create(createDeviceDto: CreateDeviceDto) {
    try {
      this.logger.log(`Sending create device request: ${JSON.stringify(createDeviceDto)}`);
      return await firstValueFrom(this.Deviceclient.send(DEVICE_PATTERNS.CREATE, createDeviceDto));
    } catch (error) {
      this.logger.error(`Error in create device: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      this.logger.log('Sending find all devices request');
      console.log(DEVICE_PATTERNS.FIND_ALL);
      return await firstValueFrom(this.Deviceclient.send(DEVICE_PATTERNS.FIND_ALL, {}));
    } catch (error) {
      this.logger.error(`Error in find all devices: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      this.logger.log(`Sending find one device request for id: ${id}`);
      return await firstValueFrom(this.Deviceclient.send(DEVICE_PATTERNS.FIND_ONE, id));
    } catch (error) {
      this.logger.error(`Error in find one device: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    try {
      this.logger.log(`Sending update device request for id: ${id}`);
      return await firstValueFrom(
        this.Deviceclient.send(DEVICE_PATTERNS.UPDATE, { id, updateDeviceDto }),
      );
    } catch (error) {
      this.logger.error(`Error in update device: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Sending remove device request for id: ${id}`);
      return await firstValueFrom(this.Deviceclient.send(DEVICE_PATTERNS.DELETE, id));
    } catch (error) {
      this.logger.error(`Error in remove device: ${error.message}`);
      throw error;
    }
  }

  async getByBuildingDetailId(buildingDetailId: string) {
    try {
      this.logger.log(`Sending get devices by building detail request for id: ${buildingDetailId}`);
      return await firstValueFrom(
        this.Deviceclient.send(DEVICE_PATTERNS.GET_BY_BUILDING_DETAIL, buildingDetailId),
      );
    } catch (error) {
      this.logger.error(`Error in get devices by building detail: ${error.message}`);
      throw error;
    }
  }

  async getByContractId(contractId: string) {
    try {
      this.logger.log(`Sending get devices by contract request for id: ${contractId}`);
      return await firstValueFrom(
        this.Deviceclient.send(DEVICE_PATTERNS.GET_BY_CONTRACT, contractId),
      );
    } catch (error) {
      this.logger.error(`Error in get devices by contract: ${error.message}`);
      throw error;
    }
  }
} 