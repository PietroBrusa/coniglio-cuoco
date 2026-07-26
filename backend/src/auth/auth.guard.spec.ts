import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, AuthedRequest } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwt: { verifyAsync: jest.Mock };

  const contextWith = (authorization?: string): { ctx: ExecutionContext; req: AuthedRequest } => {
    const req = { headers: authorization ? { authorization } : {} } as AuthedRequest;
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    return { ctx, req };
  };

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() };
    guard = new AuthGuard(jwt as unknown as JwtService);
  });

  it('allows the request and populates req.user for a valid token', async () => {
    const payload = { sub: 'John Doe', name: 'John Doe' };
    jwt.verifyAsync.mockResolvedValue(payload);
    const { ctx, req } = contextWith('Bearer good.token');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toEqual(payload);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('good.token');
  });

  it('throws 401 when the Authorization header is missing', async () => {
    const { ctx } = contextWith(undefined);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws 401 when the scheme is not Bearer', async () => {
    const { ctx } = contextWith('Basic abc');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 401 when the token fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));
    const { ctx } = contextWith('Bearer bad.token');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
