import { Test, TestingModule } from '@nestjs/testing';
import { TaskAssignmentsController } from './task-assignments.controller';
import { TaskAssignmentsService } from './task-assignments.service';

describe('TaskAssignmentsController', () => {
  let controller: TaskAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskAssignmentsController],
      providers: [TaskAssignmentsService],
    }).compile();

    controller = module.get<TaskAssignmentsController>(TaskAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
