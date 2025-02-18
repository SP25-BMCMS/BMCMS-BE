import { Controller, Get } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { Client, ClientProxy, Ctx, EventPattern, MessagePattern, Payload, RmqContext, Transport } from '@nestjs/microservices';

@Controller()
export class BuildingsController {
  @Client({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'buildings_queue',
    },
  })
  client: ClientProxy;

  constructor(private readonly buildingsService: BuildingsService) {}
  @Get()
  async sendMessage() {
    // Gửi tin nhắn đến RabbitMQ với một pattern cụ thể
    const result = await this.client.send({ cmd: 'test' }, 'Hello RabbitMQ');
    return result;
  }
  @Get()
  getHello(): string {
    return this.buildingsService.getHello();
  }
  @EventPattern('order-placed')
  // handleOrderPlaced(@Payload() order: OrderDto) {
  //   return this.appService.handleOrderPlaced(order);
  // }

  @MessagePattern({ cmd: 'fetch-orders' })
  getOrders(@Ctx() context: RmqContext) {
    console.log(context.getMessage());
    return this.buildingsService.getOrders();
  }
}
