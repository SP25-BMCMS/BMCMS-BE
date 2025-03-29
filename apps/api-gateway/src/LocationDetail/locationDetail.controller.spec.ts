import { Test, TestingModule } from '@nestjs/testing';
import { LocationDetailController } from './locationDetail.controller';

describe('LocationDetailController', () => {
  let controller: LocationDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationDetailController],
    }).compile();

    controller = module.get<LocationDetailController>(LocationDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
