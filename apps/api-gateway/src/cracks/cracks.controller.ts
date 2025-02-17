import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CrackReportDto } from 'libs/contracts/src/cracks/crack-report.dto';
import { firstValueFrom } from 'rxjs';

@Controller('cracks')
export class CracksController {
  constructor(@Inject('CRACK_SERVICE') private readonly crackService: ClientProxy) {}

  @Get()
  async getSubscribers() {
    return this.crackService.send(
      {
        cmd: 'get-all-crack-report',
      },
      {},
    );
  }

  @Post('rmq')
  async createCrackReport(@Body() crackReportDto: CrackReportDto) {
    return firstValueFrom(
      this.crackService.send({ cmd: 'create-crack-report' }, crackReportDto)
    );
  }
}
