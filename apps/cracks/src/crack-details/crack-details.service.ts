import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { UpdateCrackDetailDto } from 'libs/contracts/src/cracks/update-crack-detail.dto'
import { ApiResponse } from '../../../../libs/contracts/src/ApiResponse/api-response'
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CrackDetailsService {
  private s3: S3Client
  private bucketName: string
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    })
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')
  }

  async getAllCrackDetails() {
    return await this.prisma.crackDetail.findMany()
  }

  async findById(crackDetailsId: string) {
    const detail = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId },
    })

    if (!detail) {
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail does not exist'),
      )
    }

    try {
      // Tạo presigned URLs
      const enrichedDetail = {
        ...detail,
        photoUrl: detail.photoUrl
          ? await this.getPreSignedUrl(this.extractFileKey(detail.photoUrl))
          : null,
        aiDetectionUrl: detail.aiDetectionUrl
          ? await this.getPreSignedUrl(this.extractFileKey(detail.aiDetectionUrl))
          : null
      }

      return new ApiResponse(true, 'Crack Detail found', [enrichedDetail])
    } catch (error) {
      console.error('Lỗi khi tạo presigned URL:', error)
      return new ApiResponse(true, 'Crack Detail found', [detail])
    }
  }

  // Hàm trích xuất file key từ URL
  private extractFileKey(urlString: string): string {
    try {
      const url = new URL(urlString)
      return url.pathname.substring(1) // Bỏ dấu '/' đầu tiên
    } catch (error) {
      console.error('URL không hợp lệ:', urlString)
      throw new Error('Invalid URL format')
    }
  }

  // Hàm tạo presigned URL
  async getPreSignedUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    })

    return getSignedUrl(this.s3, command, { expiresIn: 3600 }) // URL hết hạn sau 1 giờ
  }

  async updateCrackDetail(id: string, dto: UpdateCrackDetailDto) {
    const exists = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId: id },
    })
    if (!exists)
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail does not exist'),
      )

    const data = await this.prisma.crackDetail.update({
      where: { crackDetailsId: id },
      data: { ...dto },
    })
    return new ApiResponse(true, 'Crack Detail has been updated', [data])
  }

  async deleteCrackDetail(id: string) {
    const exists = await this.prisma.crackDetail.findUnique({
      where: { crackDetailsId: id },
    })
    if (!exists)
      throw new RpcException(
        new ApiResponse(false, 'Crack Detail does not exist'),
      )

    await this.prisma.crackDetail.delete({ where: { crackDetailsId: id } })
    return new ApiResponse(true, 'Crack Detail has been deleted')
  }
}
