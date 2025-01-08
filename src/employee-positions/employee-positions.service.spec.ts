import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePositionsService } from './employee-positions.service';

describe('EmployeePositionsService', () => {
  let service: EmployeePositionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeePositionsService],
    }).compile();

    service = module.get<EmployeePositionsService>(EmployeePositionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
