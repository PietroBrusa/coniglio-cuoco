import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthCredentialsDto } from './auth-credentials.dto';

/**
 * UNIT tests for the validation rules on AuthCredentialsDto.
 *
 * These are the same rules the global ValidationPipe enforces on every
 * `/auth/*` request; testing them directly (without HTTP) documents the
 * contract and pins the boundaries (name 1–50, password 4–100).
 */

/** Validates a plain object as an AuthCredentialsDto and returns the failing property names. */
async function failingProps(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(AuthCredentialsDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('AuthCredentialsDto', () => {
  it('accepts a valid name/password pair', async () => {
    expect(await failingProps({ name: 'B001', password: 'shire123' })).toEqual([]);
  });

  it('rejects a password shorter than 4 characters', async () => {
    expect(await failingProps({ name: 'B001', password: '123' })).toContain('password');
  });

  it('rejects an empty name', async () => {
    expect(await failingProps({ name: '', password: 'shire123' })).toContain('name');
  });

  it('rejects a name longer than 50 characters', async () => {
    expect(await failingProps({ name: 'x'.repeat(51), password: 'shire123' })).toContain('name');
  });

  it('rejects non-string types', async () => {
    const props = await failingProps({ name: 123, password: true });
    expect(props).toContain('name');
    expect(props).toContain('password');
  });
});
