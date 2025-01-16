import { Test, TestingModule } from '@nestjs/testing';
import { CrackDetailsController } from './crack-details.controller';
import { CrackDetailsService } from './crack-details.service';

describe('CrackDetailsController', () => {
  let controller: CrackDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrackDetailsController],
      providers: [CrackDetailsService],
    }).compile();

    controller = module.get<CrackDetailsController>(CrackDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
