import { Module } from '@nestjs/common';
import { CrackDetailsService } from './crack-details.service';
import { CrackDetailsController } from './crack-details.controller';

@Module({
  controllers: [CrackDetailsController],
  providers: [CrackDetailsService],
})
export class CrackDetailsModule {}
