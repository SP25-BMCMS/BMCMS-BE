import { Test, TestingModule } from '@nestjs/testing';
import { BuildingDetailsController } from './buildingdetails.controller';

describe('BuildingDetailsController', () => {
  let controller: BuildingDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingDetailsController],
    }).compile();

    controller = module.get<BuildingDetailsController>(
      BuildingDetailsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
