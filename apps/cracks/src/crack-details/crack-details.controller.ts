import { BadRequestException, Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateCrackDetailDto } from 'libs/contracts/src/cracks/update-crack-detail.dto';
import { CrackDetailsService } from './crack-details.service';
import { S3UploaderService } from './s3-uploader.service';

@Controller()
export class CrackDetailsController {
  constructor(
    private readonly s3UploaderService: S3UploaderService,
    private readonly crackDetailsService: CrackDetailsService,
  ) { }

  @MessagePattern({ cmd: 'get-all-crack-details' })
  async getAllCrackReports() {
    console.log("🚀 ~ CrackDetailsController ~ getAllCrackReportádasdsdasds ~ getAllCrackReports:")
    return await this.crackDetailsService.getAllCrackDetails();
  }

  @MessagePattern({ cmd: 'get-crack-detail-by-id' })
  async getCrackDetailById(@Payload() crackId: string) {
    return await this.crackDetailsService.findById(crackId);
  }

  @MessagePattern({ cmd: 'update-crack-detail' })
  async updateCrackDetail(
    @Payload() data: { crackId: string; dto: UpdateCrackDetailDto },
  ) {
    return await this.crackDetailsService.updateCrackDetail(
      data.crackId,
      data.dto,
    );
  }

  @MessagePattern({ cmd: 'delete-crack-detail' })
  async deleteCrackDetail(@Payload() crackId: string) {
    return await this.crackDetailsService.deleteCrackDetail(crackId);
  }

  @MessagePattern({ cmd: 'upload-crack-images' })
  async uploadCrackImages(@Payload() payload: { files: any[] }) {
    if (!payload || !payload.files || payload.files.length === 0) {
      throw new BadRequestException('No files received');
    }

    // Chuyển Base64 về Buffer
    const filesWithBuffer = payload.files.map((file) => ({
      ...file,
      buffer: Buffer.from(file.buffer, 'base64'), // Convert Base64 to Buffer
    }));

    return await this.s3UploaderService.uploadFiles(filesWithBuffer);
  }

  @MessagePattern({ cmd: 'upload-inspection-images' })
  async uploadInspectionImages(@Payload() payload: { files: any[] }) {
    if (!payload || !payload.files || payload.files.length === 0) {
      throw new BadRequestException('No files received');
    }

    // Chuyển Base64 về Buffer
    const filesWithBuffer = payload.files.map((file) => ({
      ...file,
      buffer: Buffer.from(file.buffer, 'base64'), // Convert Base64 to Buffer
    }));

    return await this.s3UploaderService.uploadFilesInspection(filesWithBuffer);
  }
}
