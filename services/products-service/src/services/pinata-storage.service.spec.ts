import { Test, TestingModule } from '@nestjs/testing';
import { PinataStorageService } from './pinata-storage.service';

describe('PinataStorageService', () => {
  let service: PinataStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PinataStorageService],
    }).compile();

    service = module.get<PinataStorageService>(PinataStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
