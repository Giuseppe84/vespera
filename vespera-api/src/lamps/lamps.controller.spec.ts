import { Test, TestingModule } from '@nestjs/testing';
import { LampsController } from './lamps.controller';

describe('LampsController', () => {
  let controller: LampsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LampsController],
    }).compile();

    controller = module.get<LampsController>(LampsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
