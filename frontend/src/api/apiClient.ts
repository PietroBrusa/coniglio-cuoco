import { AuthApi, Configuration, SessionsApi } from './generated';
import { getToken } from '../auth/tokenStore';

const config = new Configuration({
  basePath: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  accessToken: () => getToken() ?? '',
});

export const authApi = new AuthApi(config);
export const sessionsApi = new SessionsApi(config);
