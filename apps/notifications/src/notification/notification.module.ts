import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    providers: [NotificationService, PrismaService],
    exports: [NotificationService, PrismaService],
})
export class NotificationModule { } 