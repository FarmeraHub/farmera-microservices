import { Test, TestingModule } from '@nestjs/testing';
import { GrpcClientController } from './grpc-client.controller';

describe('GrpcClientController', () => {
  let controller: GrpcClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcClientController],
    }).compile();

    controller = module.get<GrpcClientController>(GrpcClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
