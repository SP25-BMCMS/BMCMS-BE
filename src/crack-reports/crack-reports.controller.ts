import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CrackReportsService } from './crack-reports.service';
import { CreateCrackReportDto } from './dto/create-crack-report.dto';
import { UpdateCrackReportDto } from './dto/update-crack-report.dto';

@Controller('crack-reports')
export class CrackReportsController {
  constructor(private readonly crackReportsService: CrackReportsService) {}

  @Post()
  create(@Body() createCrackReportDto: CreateCrackReportDto) {
    return this.crackReportsService.create(createCrackReportDto);
  }

  @Get()
  findAll() {
    return this.crackReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.crackReportsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCrackReportDto: UpdateCrackReportDto) {
    return this.crackReportsService.update(+id, updateCrackReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.crackReportsService.remove(+id);
  }
}
