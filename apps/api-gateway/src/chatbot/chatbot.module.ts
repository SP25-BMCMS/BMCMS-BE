import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ClientConfigModule } from 'apps/configs/client-config.module';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from 'apps/configs/client-config.service';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from 'apps/configs/jwt-config.module';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { LocalStrategy } from '../strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { USERS_CLIENT } from '../constraints';

@Module({
  imports: [
    ClientConfigModule, 
    JwtConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    JwtStrategy,
    LocalStrategy,
    {
      provide: 'CHATBOT_CLIENT',
      useFactory: (clientConfigService: ClientConfigService) => {
        return ClientProxyFactory.create(clientConfigService.chatbotClientOptions);
      },
      inject: [ClientConfigService],
    },
  ],
  exports: ['CHATBOT_CLIENT'],
})
export class ChatbotModule {} 