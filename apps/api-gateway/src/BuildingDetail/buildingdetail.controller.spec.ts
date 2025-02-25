import { Test, TestingModule } from '@nestjs/testing';
import {BuildingDetailController as BuildingDetailController } from './buildingDetail.controller';

describe('BuildingDetailController', () => {
  let controller: BuildingDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingDetailController],
    }).compile();

    controller = module.get<BuildingDetailController>(BuildingDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
