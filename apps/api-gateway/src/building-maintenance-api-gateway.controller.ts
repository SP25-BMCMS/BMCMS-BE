import { Controller, Get } from '@nestjs/common';
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service';

@Controller()
export class BuildingMaintenanceApiGatewayController {
  constructor(
    private readonly buildingMaintenanceApiGatewayService: BuildingMaintenanceApiGatewayService,
  ) {}

  @Get()
  getHello(): string {
    return this.buildingMaintenanceApiGatewayService.getHello();
  }
}
