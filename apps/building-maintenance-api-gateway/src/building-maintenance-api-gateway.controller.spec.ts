import { Test, TestingModule } from '@nestjs/testing';
import { BuildingMaintenanceApiGatewayController } from './building-maintenance-api-gateway.controller';
import { BuildingMaintenanceApiGatewayService } from './building-maintenance-api-gateway.service';

describe('BuildingMaintenanceApiGatewayController', () => {
  let buildingMaintenanceApiGatewayController: BuildingMaintenanceApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BuildingMaintenanceApiGatewayController],
      providers: [BuildingMaintenanceApiGatewayService],
    }).compile();

    buildingMaintenanceApiGatewayController =
      app.get<BuildingMaintenanceApiGatewayController>(
        BuildingMaintenanceApiGatewayController,
      );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(buildingMaintenanceApiGatewayController.getHello()).toBe(
        'Hello World!',
      );
    });
  });
});
