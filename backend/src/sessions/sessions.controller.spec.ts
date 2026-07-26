import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AuthedRequest, AuthGuard } from '../auth/auth.guard';
import { SessionEntity } from './entities/session.entity';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: {
    create: jest.Mock;
    findByChild: jest.Mock;
    findOneForChild: jest.Mock;
    removeForChild: jest.Mock;
  };

  const req = { user: { sub: 'John Doe', name: 'John Doe' } } as AuthedRequest;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findByChild: jest.fn(),
      findOneForChild: jest.fn(),
      removeForChild: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create injects childId from the token, ignoring any body-supplied one', () => {
    const saved = {} as SessionEntity;
    service.create.mockReturnValue(saved);
    const dto = { childId: 'Sauron', sessionNumber: 1 } as unknown as CreateSessionDto;

    const result = controller.create(dto, req);

    expect(result).toBe(saved);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ childId: 'John Doe', sessionNumber: 1 }),
    );
  });

  it('findAll scopes the query to the authenticated child', () => {
    const list = [] as SessionEntity[];
    service.findByChild.mockReturnValue(list);

    expect(controller.findAll(req)).toBe(list);
    expect(service.findByChild).toHaveBeenCalledWith('John Doe');
  });

  it('findOne forwards the id and the owner', () => {
    controller.findOne('abc', req);
    expect(service.findOneForChild).toHaveBeenCalledWith('abc', 'John Doe');
  });

  it('remove forwards the id and the owner', () => {
    controller.remove('abc', req);
    expect(service.removeForChild).toHaveBeenCalledWith('abc', 'John Doe');
  });
});
