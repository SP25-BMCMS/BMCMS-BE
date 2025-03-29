import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InspectionService } from './Inspection.service';
import { catchError, firstValueFrom, NotFoundError } from 'rxjs';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { PaginationParams } from 'libs/contracts/src/Pagination/pagination.dto';
import { UpdateInspectionDto } from 'libs/contracts/src/inspections/update-inspection.dto';
import { CreateRepairMaterialDto } from '@app/contracts/repairmaterials/create-repair-material.dto';

@Controller('inspections')
@ApiTags('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get('inspection/task_assignment/:task_assignment_id')
  @ApiOperation({ summary: 'Get inspection by task assignment ID' })
  @ApiParam({ name: 'task_assignment_id', description: 'Task assignment ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async GetInspectionByTaskAssignmentId(
    @Param('task_assignment_id') task_assignment_id: string,
  ) {
    return this.inspectionService.GetInspectionByTaskAssignmentId(
      task_assignment_id,
    );
  }

  @Patch('inspection/:id')
  @ApiOperation({ summary: 'Update inspection' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  @ApiBody({ type: UpdateInspectionDto })
  @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async updateCrackReport(
    @Param('id') inspection_id: string,
    @Body() dto: UpdateInspectionDto,
  ) {
    return this.inspectionService.updateInspection(inspection_id, dto);
  }

  @Get('inspection/crack/:crack_id')
  @ApiOperation({ summary: 'Get inspection by crack ID' })
  @ApiParam({ name: 'crack_id', description: 'Crack ID' })
  @ApiResponse({ status: 200, description: 'Inspection found' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async GetInspectionByCrackId(@Param('crack_id') crack_id: string) {
    return this.inspectionService.GetInspectionByCrackId(crack_id);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'Get all inspections' })
  @ApiResponse({ status: 200, description: 'Returns all inspections' })
  async GetAllInspections() {
    return this.inspectionService.GetAllInspections();
  }

  // @Get('inspection/task_assignment/:task_assignment_id')
  // @ApiOperation({ summary: 'Get inspection by task assignment ID' })
  // @ApiParam({ name: 'task_assignment_id', description: 'Task assignment ID' })
  // @ApiResponse({ status: 200, description: 'Inspection found' })
  // @ApiResponse({ status: 404, description: 'Inspection not found' })
  // async GetInspectionByTaskAssignmentId(
  //   @Param('task_assignment_id') task_assignment_id: string,
  // ) {
  //   return this.inspectionService.GetInspectionByTaskAssignmentId(task_assignment_id);
  // }

  // @Patch('inspection/:id')
  // @ApiOperation({ summary: 'Update inspection' })
  // @ApiParam({ name: 'id', description: 'Inspection ID' })
  // @ApiBody({ type: UpdateInspectionDto })
  // @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  // @ApiResponse({ status: 404, description: 'Inspection not found' })
  // async updateCrackReport(@Param('id') inspection_id: string, @Body() dto: UpdateInspectionDto) {
  //   return this.inspectionService.updateInspection(inspection_id, dto);
  // }

  // @Get('inspection/crack/:crack_id')
  // @ApiOperation({ summary: 'Get inspection by crack ID' })
  // @ApiParam({ name: 'crack_id', description: 'Crack ID' })
  // @ApiResponse({ status: 200, description: 'Inspection found' })
  // @ApiResponse({ status: 404, description: 'Inspection not found' })
  // async GetInspectionByCrackId(
  //   @Param('crack_id') crack_id: string,
  // ) {
  //   return this.inspectionService.GetInspectionByCrackId(crack_id);
  // }

  // @Get('inspections')
  // @ApiOperation({ summary: 'Get all inspections' })
  // @ApiResponse({ status: 200, description: 'Returns all inspections' })
  // async GetAllInspections() {
  //   return this.inspectionService.GetAllInspections();
  // }
}
