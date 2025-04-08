import { Injectable, Logger } from '@nestjs/common';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignalRService {
  private connection: HubConnection;
  private readonly logger = new Logger(SignalRService.name);
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeConnection();
  }

  private initializeConnection() {
    try {
      const signalRUrl = this.configService.get<string>('SIGNALR_URL');
      if (!signalRUrl) {
        this.logger.warn('SignalR URL is not configured. SignalR features will be disabled.');
        return;
      }

      this.logger.log(`Initializing SignalR connection to: ${signalRUrl}`);
      
      this.connection = new HubConnectionBuilder()
        .withUrl(signalRUrl)
        .withAutomaticReconnect()
        .build();

      this.connection.onclose((error) => {
        this.isConnected = false;
        this.logger.error(`SignalR connection closed: ${error}`);
      });

      this.connection.onreconnecting((error) => {
        this.isConnected = false;
        this.logger.warn(`SignalR reconnecting: ${error}`);
      });

      this.connection.onreconnected((connectionId) => {
        this.isConnected = true;
        this.logger.log(`SignalR reconnected with ID: ${connectionId}`);
      });

      this.startConnection();
    } catch (error) {
      this.logger.error(`Error initializing SignalR: ${error}`);
    }
  }

  private async startConnection() {
    try {
      if (!this.connection) {
        this.logger.warn('SignalR connection not initialized. Skipping connection start.');
        return;
      }
      
      await this.connection.start();
      this.isConnected = true;
      this.logger.log('SignalR connection established successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`Error while starting SignalR connection: ${error}`);
    }
  }

  async sendToUser(userId: string, message: string) {
    try {
      if (!this.connection || !this.isConnected) {
        this.logger.warn(`SignalR connection not available. Message to user ${userId} not sent.`);
        return;
      }

      await this.connection.invoke('SendToUser', userId, message);
      this.logger.log(`Message sent to user ${userId}: ${message}`);
    } catch (error) {
      this.logger.error(`Error sending message to user ${userId}: ${error}`);
    }
  }

  async sendToAll(message: string) {
    try {
      if (!this.connection || !this.isConnected) {
        this.logger.warn('SignalR connection not available. Broadcast message not sent.');
        return;
      }

      await this.connection.invoke('SendToAll', message);
      this.logger.log(`Message sent to all users: ${message}`);
    } catch (error) {
      this.logger.error(`Error sending message to all users: ${error}`);
    }
  }
} 