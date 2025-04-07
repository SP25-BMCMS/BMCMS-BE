import { Injectable, Logger } from '@nestjs/common';
import { SignalRHub } from './signalr.hub';

@Injectable()
export class SignalRService {
  private readonly logger = new Logger(SignalRService.name);

  constructor(private readonly signalRHub: SignalRHub) {}

  async sendToUser(userId: string, method: string, message: any) {
    try {
      await this.signalRHub.sendMessageToUser(userId, message);
      this.logger.log(`Message sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending message to user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async sendToAll(method: string, message: any) {
    try {
      await this.signalRHub.sendMessageToClient(message);
      this.logger.log('Message sent to all clients');
    } catch (error) {
      this.logger.error(`Error sending message to all clients: ${error.message}`);
      throw error;
    }
  }
} 