import { Injectable } from '@nestjs/common';

@Injectable()
export class BuildingMaintenanceApiGatewayService {
  getHello(): string {
    return 'Hello World!';
  }
}
