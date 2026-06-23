/** Authentication response: signed JWT access token and child name. */
export class AuthResponseDto {
  access_token!: string;
  name!: string;
}
