import { Test, TestingModule } from '@nestjs/testing';
import { BuildingDetailService } from './buildingDetail.service';

describe('BuildingDetailService', () => {
  let service: BuildingDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuildingDetailService],
    }).compile();

    service = module.get<BuildingDetailService>(BuildingDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
