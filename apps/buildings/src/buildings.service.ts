import { Injectable } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Injectable()
export class BuildingsService {
  getHello(): string {
    return 'Hello World!';
  }
  @MessagePattern({ cmd: 'test' }) // Chỉ định pattern của tin nhắn nhận
  handleTestMessage(data: string) {
    console.log('Received message:', data);
    return `Received: ${data}`; // Trả về phản hồi
  }

   orders: { email: string }[] = [];



  getOrders() {
    return this.orders;
  }

}
