import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CrackDetailsService } from './crack-details.service';
import { CreateCrackDetailDto } from 'libs/contracts/src/cracks/create-crack-detail.dto';
import { UpdateCrackDetailDto } from 'libs/contracts/src/cracks/update-crack-detail.dto';

@Controller()
export class CrackDetailsController {
  constructor(private readonly crackDetailsService: CrackDetailsService) {}

  @MessagePattern({ cmd: 'get-all-crack-details' })
  async getAllCrackReports() {
    return await this.crackDetailsService.getAllCrackDetails();
  }

  @MessagePattern({ cmd: 'get-crack-detail-by-id' })
  async getCrackDetailById(@Payload() crackId: string) {
    return await this.crackDetailsService.findById(crackId);
  }

  @MessagePattern({ cmd: 'update-crack-detail' })
  async updateCrackDetail(@Payload() data: { crackId: string; dto: UpdateCrackDetailDto }) {
    return await this.crackDetailsService.updateCrackDetail(data.crackId, data.dto);
  }

  @MessagePattern({ cmd: 'delete-crack-detail' })
  async deleteCrackDetail(@Payload() crackId: string) {
    return await this.crackDetailsService.deleteCrackDetail(crackId);
  }
}
