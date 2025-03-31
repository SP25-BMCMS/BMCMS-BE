import { Module } from '@nestjs/common';
import { S3UploaderService } from './s3-uploader.service';

@Module({
    providers: [S3UploaderService],
    exports: [S3UploaderService],
})
export class S3UploaderModule { } 