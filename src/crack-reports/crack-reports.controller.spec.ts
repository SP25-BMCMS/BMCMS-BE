import { Test, TestingModule } from '@nestjs/testing';
import { CrackReportsController } from './crack-reports.controller';
import { CrackReportsService } from './crack-reports.service';

describe('CrackReportsController', () => {
  let controller: CrackReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrackReportsController],
      providers: [CrackReportsService],
    }).compile();

    controller = module.get<CrackReportsController>(CrackReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
