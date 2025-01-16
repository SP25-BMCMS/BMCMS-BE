import { Injectable } from '@nestjs/common';
import { CreateCrackReportDto } from './dto/create-crack-report.dto';
import { UpdateCrackReportDto } from './dto/update-crack-report.dto';

@Injectable()
export class CrackReportsService {
  create(createCrackReportDto: CreateCrackReportDto) {
    return 'This action adds a new crackReport';
  }

  findAll() {
    return `This action returns all crackReports`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crackReport`;
  }

  update(id: number, updateCrackReportDto: UpdateCrackReportDto) {
    return `This action updates a #${id} crackReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} crackReport`;
  }
}
