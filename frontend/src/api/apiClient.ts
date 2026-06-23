import { AuthApi, Configuration, SessionsApi } from './generated';
import { getToken } from '../auth/tokenStore';

/**
 * Configuration and singleton instances of the OpenAPI-generated Axios client.
 * The JWT token is injected automatically as a `Bearer` header, read lazily
 * from {@link getToken} at request time.
 */
const config = new Configuration({
  basePath: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  accessToken: () => getToken() ?? '',
});

export const authApi = new AuthApi(config);
export const sessionsApi = new SessionsApi(config);
