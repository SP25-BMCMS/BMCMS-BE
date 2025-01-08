import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleJobsService } from './schedule-jobs.service';

describe('ScheduleJobsService', () => {
  let service: ScheduleJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleJobsService],
    }).compile();

    service = module.get<ScheduleJobsService>(ScheduleJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
