import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkingPositionsService } from './working-positions.service';
import { CreateWorkingPositionDto } from './dto/create-working-position.dto';
import { UpdateWorkingPositionDto } from './dto/update-working-position.dto';

@Controller('workingpositions')
export class WorkingPositionsController {
  constructor(private readonly workingPositionsService: WorkingPositionsService) { }

  @Post()
  create(@Body() createWorkingPositionDto: CreateWorkingPositionDto) {
    return this.workingPositionsService.create(createWorkingPositionDto);
  }

  @Get()
  findAll() {
    return this.workingPositionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workingPositionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkingPositionDto: UpdateWorkingPositionDto) {
    return this.workingPositionsService.update(+id, updateWorkingPositionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workingPositionsService.remove(+id);
  }
}
