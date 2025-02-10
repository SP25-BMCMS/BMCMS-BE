import { Controller, Get } from '@nestjs/common';
import { BuildingsService } from './buildings.service';

@Controller()
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  getHello(): string {
    return this.buildingsService.getHello();
  }
}
