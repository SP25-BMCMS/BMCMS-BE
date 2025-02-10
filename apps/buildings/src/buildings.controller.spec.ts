import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';

describe('BuildingsController', () => {
  let buildingsController: BuildingsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BuildingsController],
      providers: [BuildingsService],
    }).compile();

    buildingsController = app.get<BuildingsController>(BuildingsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(buildingsController.getHello()).toBe('Hello World!');
    });
  });
});
