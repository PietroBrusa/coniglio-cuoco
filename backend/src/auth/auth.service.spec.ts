import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { ChildrenService } from '../children/children.service';
import { ChildEntity } from '../children/entities/child.entity';

describe('AuthService', () => {
  let service: AuthService;
  let children: {
    findByName: jest.Mock;
    create: jest.Mock;
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    children = {
      findByName: jest.fn(),
      create: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ChildrenService, useValue: children },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes the password, creates the child and returns a token', async () => {
      children.findByName.mockResolvedValue(null);
      children.create.mockResolvedValue({} as ChildEntity);

      const result = await service.register({ name: 'John Doe', password: 'password123' });

      expect(result).toEqual({ access_token: 'signed.jwt.token', name: 'John Doe' });
      expect(children.create).toHaveBeenCalledTimes(1);
      const [nameArg, hashArg] = children.create.mock.calls[0];
      expect(nameArg).toBe('John Doe');
      expect(hashArg).not.toBe('password123');
      await expect(bcrypt.compare('password123', hashArg)).resolves.toBe(true);
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'John Doe', name: 'John Doe' });
    });

    it('throws 409 Conflict when the name is already taken', async () => {
      children.findByName.mockResolvedValue({ name: 'John Doe' } as ChildEntity);

      await expect(
        service.register({ name: 'John Doe', password: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(children.create).not.toHaveBeenCalled();
    });

    it('throws 409 Conflict, not 500, when the insert loses a registration race', async () => {
      children.findByName.mockResolvedValue(null);
      children.create.mockRejectedValue(
        Object.assign(new Error('E11000 duplicate key error'), { code: 11000 }),
      );

      await expect(
        service.register({ name: 'John Doe', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets an unrelated insert failure propagate', async () => {
      children.findByName.mockResolvedValue(null);
      children.create.mockRejectedValue(new Error('Mongo is down'));

      await expect(
        service.register({ name: 'John Doe', password: 'password123' }),
      ).rejects.toThrow('Mongo is down');
    });
  });

  describe('login', () => {
    it('returns a token when the password matches', async () => {
      const passwordHash = await bcrypt.hash('secret456', 10);
      children.findByName.mockResolvedValue({ name: 'Richard Roe', passwordHash } as ChildEntity);

      const result = await service.login({ name: 'Richard Roe', password: 'secret456' });

      expect(result).toEqual({ access_token: 'signed.jwt.token', name: 'Richard Roe' });
    });

    it('throws 401 when the child does not exist', async () => {
      children.findByName.mockResolvedValue(null);

      await expect(
        service.login({ name: 'ghost', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 401 when the password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct', 10);
      children.findByName.mockResolvedValue({ name: 'Richard Roe', passwordHash } as ChildEntity);

      await expect(
        service.login({ name: 'Richard Roe', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 401, not 500, when the stored password hash is missing or corrupt', async () => {
      children.findByName.mockResolvedValue({
        name: 'Richard Roe',
        passwordHash: undefined,
      } as unknown as ChildEntity);

      await expect(
        service.login({ name: 'Richard Roe', password: 'secret456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
