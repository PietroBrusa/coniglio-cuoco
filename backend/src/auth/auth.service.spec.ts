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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('hashes the password, creates the child and returns a token', async () => {
      children.findByName.mockResolvedValue(null);
      children.create.mockResolvedValue({} as ChildEntity);

      const result = await service.register({ name: 'Frodo', password: 'shire123' });

      expect(result).toEqual({ access_token: 'signed.jwt.token', name: 'Frodo' });
      expect(children.create).toHaveBeenCalledTimes(1);
      const [nameArg, hashArg] = children.create.mock.calls[0];
      expect(nameArg).toBe('Frodo');
      expect(hashArg).not.toBe('shire123');
      await expect(bcrypt.compare('shire123', hashArg)).resolves.toBe(true);
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'Frodo', name: 'Frodo' });
    });

    it('throws 409 Conflict when the name is already taken', async () => {
      children.findByName.mockResolvedValue({ name: 'Frodo' } as ChildEntity);

      await expect(
        service.register({ name: 'Frodo', password: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(children.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token when the password matches', async () => {
      const passwordHash = await bcrypt.hash('mellon', 10);
      children.findByName.mockResolvedValue({ name: 'Gandalf', passwordHash } as ChildEntity);

      const result = await service.login({ name: 'Gandalf', password: 'mellon' });

      expect(result).toEqual({ access_token: 'signed.jwt.token', name: 'Gandalf' });
    });

    it('throws 401 when the child does not exist', async () => {
      children.findByName.mockResolvedValue(null);

      await expect(
        service.login({ name: 'ghost', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 401 when the password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct', 10);
      children.findByName.mockResolvedValue({ name: 'Gandalf', passwordHash } as ChildEntity);

      await expect(
        service.login({ name: 'Gandalf', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
