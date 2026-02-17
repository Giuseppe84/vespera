import { Test, TestingModule } from '@nestjs/testing';
import { LampsService } from './lamps.service';

describe('LampsService', () => {
  let service: LampsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LampsService],
    }).compile();

    service = module.get<LampsService>(LampsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
