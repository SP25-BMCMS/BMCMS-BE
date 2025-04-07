import { Injectable } from '@nestjs/common';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Injectable()
export class SignalRHub {
  private hubConnection: HubConnection;

  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5000/chatHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.log('Error while starting SignalR connection: ' + err));
  }

  async sendMessageToClient(message: any) {
    await this.hubConnection.invoke('SendToAll', 'ReceiveMessage', message);
  }

  async sendMessageToUser(userId: string, message: any) {
    await this.hubConnection.invoke('SendToUser', userId, 'ReceiveMessage', message);
  }

  async onConnected(connectionId: string) {
    console.log(`Client connected: ${connectionId}`);
  }

  async onDisconnected(connectionId: string) {
    console.log(`Client disconnected: ${connectionId}`);
  }
} 