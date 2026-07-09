import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AuthedRequest, AuthGuard } from '../auth/auth.guard';
import { SessionEntity } from './entities/session.entity';

/**
 * UNIT tests for SessionsController.
 *
 * SessionsService is fully mocked: we only verify the controller's own
 * responsibility, which is wiring the authenticated child's id (from the JWT,
 * exposed as `req.user`) into every service call — never trusting the body.
 */
describe('SessionsController', () => {
  let controller: SessionsController;
  let service: {
    create: jest.Mock;
    findByChild: jest.Mock;
    findOneForChild: jest.Mock;
    removeForChild: jest.Mock;
  };

  const req = { user: { sub: 'Frodo', name: 'Frodo' } } as AuthedRequest;

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
      // The guard is exercised separately in auth.guard.spec.ts; here we stub it
      // so the controller can be instantiated without wiring up JwtService.
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
    // Malicious client tries to write a session for someone else:
    const dto = { childId: 'Sauron', sessionNumber: 1 } as unknown as CreateSessionDto;

    const result = controller.create(dto, req);

    expect(result).toBe(saved);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ childId: 'Frodo', sessionNumber: 1 }),
    );
  });

  it('findAll scopes the query to the authenticated child', () => {
    const list = [] as SessionEntity[];
    service.findByChild.mockReturnValue(list);

    expect(controller.findAll(req)).toBe(list);
    expect(service.findByChild).toHaveBeenCalledWith('Frodo');
  });

  it('findOne forwards the id and the owner', () => {
    controller.findOne('abc', req);
    expect(service.findOneForChild).toHaveBeenCalledWith('abc', 'Frodo');
  });

  it('remove forwards the id and the owner', () => {
    controller.remove('abc', req);
    expect(service.removeForChild).toHaveBeenCalledWith('abc', 'Frodo');
  });
});
