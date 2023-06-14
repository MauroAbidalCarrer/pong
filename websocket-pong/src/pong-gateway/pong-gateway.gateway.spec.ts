import { Test, TestingModule } from '@nestjs/testing';
import { PongGatewayGateway } from './pong-gateway.gateway';

describe('PongGatewayGateway', () => {
  let gateway: PongGatewayGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PongGatewayGateway],
    }).compile();

    gateway = module.get<PongGatewayGateway>(PongGatewayGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
