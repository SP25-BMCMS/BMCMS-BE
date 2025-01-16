import { Test, TestingModule } from '@nestjs/testing';
import { CrackDetailsService } from './crack-details.service';

describe('CrackDetailsService', () => {
  let service: CrackDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrackDetailsService],
    }).compile();

    service = module.get<CrackDetailsService>(CrackDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
