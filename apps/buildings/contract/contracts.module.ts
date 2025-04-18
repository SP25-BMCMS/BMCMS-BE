import { Module } from '@nestjs/common'
import { ContractsController } from './contracts.controller'
import { ContractsService } from './contracts.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ConfigModule } from '@nestjs/config'
import { S3UploaderService } from './s3-uploader.service'

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [ContractsController],
    providers: [ContractsService, S3UploaderService],
    exports: [ContractsService],
})
export class ContractsModule { }
