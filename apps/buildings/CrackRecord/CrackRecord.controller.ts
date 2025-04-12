import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CrackRecordService } from './CrackRecord.service';
import { CreateCrackRecordDto } from '@app/contracts/CrackRecord/create-CrackRecord.dto';
import { UpdateCrackRecordDto } from '@app/contracts/CrackRecord/update-CrackRecord.dto';
import { CRACK_RECORD_PATTERNS } from '@app/contracts/CrackRecord/CrackRecord.patterns';

@Controller('crack-record')
export class CrackRecordController {
  constructor(private readonly crackRecordService: CrackRecordService) {}

  @MessagePattern(CRACK_RECORD_PATTERNS.CREATE)
  create(@Payload() createDto: CreateCrackRecordDto) {
    return this.crackRecordService.create(createDto);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_ALL)
  findAll(
    @Payload() paginationParams: { page: number, limit: number, search: string }
  ) {
    return this.crackRecordService.findAll(paginationParams.page, paginationParams.limit, paginationParams.search);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_ID)
  findOne(@Payload() crackRecordId: string) {
    return this.crackRecordService.findOne(crackRecordId);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.UPDATE)
  update(@Payload() payload: { crackRecordId: string; updateDto: UpdateCrackRecordDto }) {
    return this.crackRecordService.update(payload.crackRecordId, payload.updateDto);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.DELETE)
  remove(@Payload() crackRecordId: string) {
    return this.crackRecordService.remove(crackRecordId);
  }

  @MessagePattern(CRACK_RECORD_PATTERNS.GET_BY_LOCATION)
  findByLocation(@Payload() locationDetailId: string) {
    return this.crackRecordService.findByLocation(locationDetailId);
  }
} 