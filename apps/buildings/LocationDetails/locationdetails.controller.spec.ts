import { Test, TestingModule } from '@nestjs/testing';
import { LocationDetailsController as locationDetailsController } from './locationdetails.controller';

describe('locationDetailsController', () => {
  let controller: locationDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [locationDetailsController],
    }).compile();

    controller = module.get<locationDetailsController>(
      locationDetailsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
