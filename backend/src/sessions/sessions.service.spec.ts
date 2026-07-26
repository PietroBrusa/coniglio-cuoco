import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { SessionsService } from './sessions.service';
import { SessionEntity } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

describe('SessionsService', () => {
  let service: SessionsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    deleteOne: jest.Mock;
  };

  const validId = new ObjectId().toHexString();

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(SessionEntity), useValue: repo },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('create persists the built entity', async () => {
    const dto = { childId: 'Frodo' } as CreateSessionDto;
    const entity = { ...dto } as SessionEntity;
    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toBe(entity);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(entity);
  });

  it('findByChild queries by owner, most recent first', async () => {
    const list = [{ childId: 'Frodo' }] as SessionEntity[];
    repo.find.mockResolvedValue(list);

    await expect(service.findByChild('Frodo')).resolves.toBe(list);
    expect(repo.find).toHaveBeenCalledWith({
      where: { childId: 'Frodo' },
      order: { createdAt: 'DESC' },
    });
  });

  describe('findOneForChild', () => {
    it('returns the session when it exists and belongs to the child', async () => {
      const session = { childId: 'Frodo' } as SessionEntity;
      repo.findOneBy.mockResolvedValue(session);

      await expect(service.findOneForChild(validId, 'Frodo')).resolves.toBe(session);
    });

    it('throws 404 for a malformed id (without touching the repository)', async () => {
      await expect(
        service.findOneForChild('not-an-objectid', 'Frodo'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });

    it('throws 404 when the session does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(
        service.findOneForChild(validId, 'Frodo'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 404 when the session belongs to another child (ownership check)', async () => {
      repo.findOneBy.mockResolvedValue({ childId: 'Sauron' } as SessionEntity);
      await expect(
        service.findOneForChild(validId, 'Frodo'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeForChild', () => {
    it('deletes the session after the ownership check passes', async () => {
      repo.findOneBy.mockResolvedValue({ childId: 'Frodo' } as SessionEntity);
      repo.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(service.removeForChild(validId, 'Frodo')).resolves.toEqual({
        deleted: true,
        id: validId,
      });
      expect(repo.deleteOne).toHaveBeenCalledTimes(1);
    });

    it('does not delete when ownership check fails', async () => {
      repo.findOneBy.mockResolvedValue({ childId: 'Sauron' } as SessionEntity);

      await expect(
        service.removeForChild(validId, 'Frodo'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.deleteOne).not.toHaveBeenCalled();
    });
  });
});
