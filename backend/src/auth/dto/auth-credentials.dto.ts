import { IsString, MaxLength, MinLength } from 'class-validator';

/** Validated credentials for registration and login (name + password). */
export class AuthCredentialsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(100)
  password!: string;
}
