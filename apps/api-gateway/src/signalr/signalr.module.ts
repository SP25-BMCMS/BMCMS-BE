import { Module } from '@nestjs/common';
import { SignalRService } from './signalr.service';
import { SignalRHub } from './signalr.hub';

@Module({
  providers: [SignalRService, SignalRHub],
  exports: [SignalRService],
})
export class SignalRModule {} 