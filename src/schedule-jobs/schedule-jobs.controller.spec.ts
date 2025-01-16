import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleJobsController } from './schedule-jobs.controller';
import { ScheduleJobsService } from './schedule-jobs.service';

describe('ScheduleJobsController', () => {
  let controller: ScheduleJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleJobsController],
      providers: [ScheduleJobsService],
    }).compile();

    controller = module.get<ScheduleJobsController>(ScheduleJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
