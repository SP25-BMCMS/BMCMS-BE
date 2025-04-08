import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { SignalRModule } from '../signalr/signalr.module';

@Module({
  imports: [ClientConfigModule, SignalRModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    {
      provide: 'CHATBOT_CLIENT',
      useFactory: (clientConfigService: ClientConfigService) => {
        return ClientProxyFactory.create(clientConfigService.chatbotClientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
})
export class ChatbotModule {} 