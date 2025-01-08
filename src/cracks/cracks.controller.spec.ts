import { Test, TestingModule } from '@nestjs/testing';
import { CracksController } from './cracks.controller';

describe('CracksController', () => {
  let controller: CracksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CracksController],
    }).compile();

    controller = module.get<CracksController>(CracksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
