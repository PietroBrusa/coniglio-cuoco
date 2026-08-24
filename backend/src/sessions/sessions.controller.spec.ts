import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AuthedRequest, AuthGuard } from '../auth/auth.guard';
import { SessionEntity } from './entities/session.entity';

const buildEntity = (overrides: Partial<SessionEntity> = {}): SessionEntity =>
  ({
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    childId: 'John Doe',
    sessionNumber: 1,
    food: 'Carota',
    foodId: 'carota',
    difficulty: 'facile',
    therapist: 'Mary Major',
    problemBehaviors: [],
    notes: '',
    date: '2026-07-01T10:00:00.000Z',
    levels: [],
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    ...overrides,
  }) as SessionEntity;

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

  it('create injects childId from the token, ignoring any body-supplied one, and serialises the entity', async () => {
    const saved = buildEntity();
    service.create.mockResolvedValue(saved);
    const dto = { childId: 'Sauron', sessionNumber: 1 } as unknown as CreateSessionDto;

    const result = await controller.create(dto, req);

    expect(result).toEqual({
      _id: '507f1f77bcf86cd799439011',
      childId: 'John Doe',
      sessionNumber: 1,
      food: 'Carota',
      foodId: 'carota',
      difficulty: 'facile',
      therapist: 'Mary Major',
      problemBehaviors: [],
      notes: '',
      date: '2026-07-01T10:00:00.000Z',
      levels: [],
      createdAt: '2026-07-01T10:00:00.000Z',
    });
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ childId: 'John Doe', sessionNumber: 1 }),
    );
  });

  it('findAll scopes the query to the authenticated child and serialises every entity', async () => {
    const list = [buildEntity(), buildEntity({ _id: new ObjectId('507f1f77bcf86cd799439012') })];
    service.findByChild.mockResolvedValue(list);

    const result = await controller.findAll(req);

    expect(result.map((s) => s._id)).toEqual([
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
    ]);
    expect(service.findByChild).toHaveBeenCalledWith('John Doe');
  });

  it('findOne forwards the id and the owner, and serialises the entity', async () => {
    service.findOneForChild.mockResolvedValue(buildEntity());

    const result = await controller.findOne('abc', req);

    expect(result._id).toBe('507f1f77bcf86cd799439011');
    expect(service.findOneForChild).toHaveBeenCalledWith('abc', 'John Doe');
  });

  it('remove forwards the id and the owner', () => {
    controller.remove('abc', req);
    expect(service.removeForChild).toHaveBeenCalledWith('abc', 'John Doe');
  });
});
