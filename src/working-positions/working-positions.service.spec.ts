import { Test, TestingModule } from '@nestjs/testing';
import { WorkingPositionsService } from './working-positions.service';

describe('WorkingPositionsService', () => {
  let service: WorkingPositionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkingPositionsService],
    }).compile();

    service = module.get<WorkingPositionsService>(WorkingPositionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
