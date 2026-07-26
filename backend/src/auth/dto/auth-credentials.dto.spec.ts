import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthCredentialsDto } from './auth-credentials.dto';

async function failingProps(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(AuthCredentialsDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('AuthCredentialsDto', () => {
  it('accepts a valid name/password pair', async () => {
    expect(await failingProps({ name: 'B001', password: 'password123' })).toEqual([]);
  });

  it('rejects a password shorter than 4 characters', async () => {
    expect(await failingProps({ name: 'B001', password: '123' })).toContain('password');
  });

  it('rejects an empty name', async () => {
    expect(await failingProps({ name: '', password: 'password123' })).toContain('name');
  });

  it('rejects a name longer than 50 characters', async () => {
    expect(await failingProps({ name: 'x'.repeat(51), password: 'password123' })).toContain('name');
  });

  it('rejects non-string types', async () => {
    const props = await failingProps({ name: 123, password: true });
    expect(props).toContain('name');
    expect(props).toContain('password');
  });
});
