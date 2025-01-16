import { Test, TestingModule } from '@nestjs/testing';
import { LocationDetailsController } from './location-details.controller';
import { LocationDetailsService } from './location-details.service';

describe('LocationDetailsController', () => {
  let controller: LocationDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationDetailsController],
      providers: [LocationDetailsService],
    }).compile();

    controller = module.get<LocationDetailsController>(LocationDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
