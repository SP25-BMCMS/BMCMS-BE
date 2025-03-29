import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { RpcException } from '@nestjs/microservices';
import { ApiResponse } from '@app/contracts/ApiReponse/api-response';

@Injectable()
export class S3UploaderService {
  private s3: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
  }

  async uploadFiles(files: Express.Multer.File[]) {
    if (files.length === 0) {
      throw new RpcException(new ApiResponse(false, 'Files not found!'));
    }

    // Upload ảnh gốc lên S3
    const uploadPromises = files.map(async (file) => {
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: `uploads/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await this.s3.send(new PutObjectCommand(uploadParams));

      return fileName; // Chỉ lưu tên file
    });

    // Chờ tất cả ảnh upload xong
    const fileNames = await Promise.all(uploadPromises);

    // Tạo URL cho ảnh gốc và ảnh đã annotate
    const uploadImage = fileNames.map(
      (fileName) =>
        `https://${this.bucketName}.s3.amazonaws.com/uploads/${fileName}`,
    );
    const annotatedImage = fileNames.map(
      (fileName) =>
        `https://${this.bucketName}.s3.amazonaws.com/annotated/${fileName}`,
    );

    return new ApiResponse(true, 'Upload Image success!', {
      uploadImage,
      annotatedImage,
    });
  }
}
