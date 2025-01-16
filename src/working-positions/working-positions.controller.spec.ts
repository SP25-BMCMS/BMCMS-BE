import { Test, TestingModule } from '@nestjs/testing';
import { WorkingPositionsController } from './working-positions.controller';
import { WorkingPositionsService } from './working-positions.service';

describe('WorkingPositionsController', () => {
  let controller: WorkingPositionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkingPositionsController],
      providers: [WorkingPositionsService],
    }).compile();

    controller = module.get<WorkingPositionsController>(WorkingPositionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
