import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChildrenService } from './children.service';
import { ChildEntity } from './entities/child.entity';

/**
 * UNIT tests for ChildrenService.
 *
 * The TypeORM MongoRepository is a heavy external dependency (a live DB
 * connection), so here it is replaced by a fake object exposing only the two
 * methods the service actually uses. This keeps the test fast and deterministic.
 */
describe('ChildrenService', () => {
  let service: ChildrenService;
  let repo: { findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        { provide: getRepositoryToken(ChildEntity), useValue: repo },
      ],
    }).compile();

    service = module.get<ChildrenService>(ChildrenService);
  });

  it('findByName delegates to the repository', async () => {
    const child = { name: 'Sam' } as ChildEntity;
    repo.findOneBy.mockResolvedValue(child);

    await expect(service.findByName('Sam')).resolves.toBe(child);
    expect(repo.findOneBy).toHaveBeenCalledWith({ name: 'Sam' });
  });

  it('findByName returns null when not found', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findByName('nobody')).resolves.toBeNull();
  });

  it('create builds the entity and persists it', async () => {
    const entity = { name: 'Merry', passwordHash: 'hash' } as ChildEntity;
    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);

    const result = await service.create('Merry', 'hash');

    expect(repo.create).toHaveBeenCalledWith({ name: 'Merry', passwordHash: 'hash' });
    expect(repo.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(entity);
  });
});
