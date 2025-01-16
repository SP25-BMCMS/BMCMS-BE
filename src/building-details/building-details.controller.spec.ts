import { Test, TestingModule } from '@nestjs/testing';
import { BuildingDetailsController } from './building-details.controller';
import { BuildingDetailsService } from './building-details.service';

describe('BuildingDetailsController', () => {
  let controller: BuildingDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingDetailsController],
      providers: [BuildingDetailsService],
    }).compile();

    controller = module.get<BuildingDetailsController>(BuildingDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
