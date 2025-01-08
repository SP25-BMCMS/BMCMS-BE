import { Module } from '@nestjs/common';
import { CracksController } from './cracks.controller';
import { CracksService } from './cracks.service';

@Module({
  controllers: [CracksController],
  providers: [CracksService]
})
export class CracksModule {}
