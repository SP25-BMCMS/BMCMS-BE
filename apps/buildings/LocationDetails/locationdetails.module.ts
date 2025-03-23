import { Module } from '@nestjs/common';
import {  LocationDetailService } from './locationdetails.service';
import {  LocationDetailsController } from './locationdetails.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [PrismaModule],
  providers: [LocationDetailService],
  controllers: [LocationDetailsController]
})
export class locationDetailsModulee {}
