import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { DeviceService } from './Device.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateDeviceDto } from '@app/contracts/Device/update-Device.dto';
import { CreateDeviceDto } from '@app/contracts/Device/create-Device.dto';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: 201, description: 'Device created successfully' })
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    try {
      this.logger.log(`Received create device request: ${JSON.stringify(createDeviceDto)}`);
      return await this.deviceService.create(createDeviceDto);
    } catch (error) {
      this.logger.error(`Error in create device: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({ status: 200, description: 'Return all devices' })
  async findAll() {
    try {


      this.logger.log('Received find all devices request');
      return await this.deviceService.findAll();
    } catch (error) {
      this.logger.error(`Error in find all devices: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by id' })
  @ApiResponse({ status: 200, description: 'Return the device' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Received find one device request for id: ${id}`);
      return await this.deviceService.findOne(id);
    } catch (error) {
      this.logger.error(`Error in find one device: ${error.message}`);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  async update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    try {
      this.logger.log(`Received update device request for id: ${id}`);
      return await this.deviceService.update(id, updateDeviceDto);
    } catch (error) {
      this.logger.error(`Error in update device: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Received remove device request for id: ${id}`);
      return await this.deviceService.remove(id);
    } catch (error) {
      this.logger.error(`Error in remove device: ${error.message}`);
      throw error;
    }
  }

  @Get('building/:buildingDetailId')
  @ApiOperation({ summary: 'Get devices by building detail id' })
  @ApiResponse({ status: 200, description: 'Return devices for the building detail' })
  async getByBuildingDetailId(@Param('buildingDetailId') buildingDetailId: string) {
    try {
      this.logger.log(`Received get devices by building detail request for id: ${buildingDetailId}`);
      return await this.deviceService.getByBuildingDetailId(buildingDetailId);
    } catch (error) {
      this.logger.error(`Error in get devices by building detail: ${error.message}`);
      throw error;
    }
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get devices by contract id' })
  @ApiResponse({ status: 200, description: 'Return devices for the contract' })
  async getByContractId(@Param('contractId') contractId: string) {
    try {
      this.logger.log(`Received get devices by contract request for id: ${contractId}`);
      return await this.deviceService.getByContractId(contractId);
    } catch (error) {
      this.logger.error(`Error in get devices by contract: ${error.message}`);
      throw error;
    }
  }
} 