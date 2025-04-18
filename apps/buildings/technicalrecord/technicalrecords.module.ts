import { Module } from '@nestjs/common';
import { TechnicalRecordsService } from './technicalrecords.service';
import { TechnicalRecordsController } from './technicalrecords.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { S3UploaderService } from './s3-uploader.service';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [TechnicalRecordsController],
    providers: [TechnicalRecordsService, S3UploaderService],
    exports: [TechnicalRecordsService]
})
export class TechnicalRecordsModule { }
