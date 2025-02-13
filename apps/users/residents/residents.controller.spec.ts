import { Test, TestingModule } from '@nestjs/testing';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';

describe('ResidentsController', () => {
  let controller: ResidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResidentsController],
      providers: [ResidentsService],
    }).compile();

    controller = module.get<ResidentsController>(ResidentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
