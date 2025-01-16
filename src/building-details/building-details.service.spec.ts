import { Test, TestingModule } from '@nestjs/testing';
import { BuildingDetailsService } from './building-details.service';

describe('BuildingDetailsService', () => {
  let service: BuildingDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuildingDetailsService],
    }).compile();

    service = module.get<BuildingDetailsService>(BuildingDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
