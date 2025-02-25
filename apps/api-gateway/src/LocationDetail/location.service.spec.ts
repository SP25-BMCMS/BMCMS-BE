import { Test, TestingModule } from '@nestjs/testing';
import { LocationDetailService } from './locationDetail.service';

describe('BuildingDetailService', () => {
  let service: LocationDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationDetailService],
    }).compile();

    service = module.get<LocationDetailService>(LocationDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
