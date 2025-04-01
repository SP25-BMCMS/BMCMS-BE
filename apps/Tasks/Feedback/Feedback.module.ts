import { Module } from '@nestjs/common';
import { FeedbackController } from './Feedback.controller';
import { FeedbackService } from './Feedback.service';
import { PrismaModule } from '../../users/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {} 