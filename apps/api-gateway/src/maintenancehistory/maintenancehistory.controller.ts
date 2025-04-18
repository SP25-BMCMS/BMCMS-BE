import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MaintenancehistoryService } from './maintenancehistory.service';
import { CreateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/create-maintenancehistory.dto';
import { UpdateMaintenanceHistoryDto } from '@app/contracts/maintenancehistory/update-maintenancehistory.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Maintenance History')
@Controller('maintenance-history')
@ApiBearerAuth()
export class MaintenancehistoryController {
  constructor(private readonly maintenancehistoryService: MaintenancehistoryService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo mới một lịch sử bảo trì' })
  @ApiResponse({ status: 201, description: 'Lịch sử bảo trì đã được tạo thành công.', type: Object })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  create(@Body() createMaintenanceHistoryDto: CreateMaintenanceHistoryDto) {
    return this.maintenancehistoryService.create(createMaintenanceHistoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch sử bảo trì' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi mỗi trang', type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lịch sử bảo trì', type: [Object] })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.maintenancehistoryService.findAll(+page, +limit);
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Lấy danh sách lịch sử bảo trì theo thiết bị' })
  @ApiParam({ name: 'deviceId', description: 'ID của thiết bị' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi mỗi trang', type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lịch sử bảo trì theo thiết bị', type: [Object] })
  findByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.maintenancehistoryService.findByDeviceId(deviceId, +page, +limit);
  }

  @Get('building/:buildingId')
  @ApiOperation({ summary: 'Lấy danh sách lịch sử bảo trì theo tòa nhà' })
  @ApiParam({ name: 'buildingId', description: 'ID của tòa nhà' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi mỗi trang', type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách lịch sử bảo trì theo tòa nhà', type: [Object] })
  findByBuildingId(
    @Param('buildingId') buildingId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.maintenancehistoryService.findByBuildingId(buildingId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một lịch sử bảo trì theo ID' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử bảo trì' })
  @ApiResponse({ status: 200, description: 'Thông tin lịch sử bảo trì', type: Object })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch sử bảo trì' })
  findOne(@Param('id') id: string) {
    return this.maintenancehistoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin lịch sử bảo trì' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử bảo trì' })
  @ApiResponse({ status: 200, description: 'Lịch sử bảo trì đã được cập nhật', type: Object })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch sử bảo trì' })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceHistoryDto: UpdateMaintenanceHistoryDto,
  ) {
    return this.maintenancehistoryService.update(id, updateMaintenanceHistoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một lịch sử bảo trì' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử bảo trì' })
  @ApiResponse({ status: 200, description: 'Lịch sử bảo trì đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch sử bảo trì' })
  remove(@Param('id') id: string) {
    return this.maintenancehistoryService.remove(id);
  }
}
