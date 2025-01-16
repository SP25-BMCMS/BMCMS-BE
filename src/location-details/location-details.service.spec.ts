import { Test, TestingModule } from '@nestjs/testing';
import { LocationDetailsService } from './location-details.service';

describe('LocationDetailsService', () => {
  let service: LocationDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationDetailsService],
    }).compile();

    service = module.get<LocationDetailsService>(LocationDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
