import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePositionsController } from './employee-positions.controller';

describe('EmployeePositionsController', () => {
  let controller: EmployeePositionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeePositionsController],
    }).compile();

    controller = module.get<EmployeePositionsController>(EmployeePositionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
