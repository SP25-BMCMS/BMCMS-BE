import { Module } from '@nestjs/common';
import { CrackReportsModule } from './crack-reports/crack-reports.module';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigModule } from '../../configs/client-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CrackDetailsModule } from './crack-details/crack-details.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientConfigModule,
    CrackReportsModule,
    CrackDetailsModule,
    PrismaModule,
  ],
})
export class CracksModule { }