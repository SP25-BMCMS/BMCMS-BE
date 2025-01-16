import { Test, TestingModule } from '@nestjs/testing';
import { CrackReportsService } from './crack-reports.service';

describe('CrackReportsService', () => {
  let service: CrackReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrackReportsService],
    }).compile();

    service = module.get<CrackReportsService>(CrackReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
