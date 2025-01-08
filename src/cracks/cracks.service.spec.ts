import { Test, TestingModule } from '@nestjs/testing';
import { CracksService } from './cracks.service';

describe('CracksService', () => {
  let service: CracksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CracksService],
    }).compile();

    service = module.get<CracksService>(CracksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
