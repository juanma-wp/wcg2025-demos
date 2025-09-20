import ky from 'ky';
import { OAuthConfig, OAuthTokenResponse, UserInfo, debugLog } from '../utils/oauth';

const config: OAuthConfig = {
  wpBaseUrl: import.meta.env.VITE_WP_BASE_URL || 'http://localhost:8080',
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID || 'demo-client',
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || 'http://localhost:5174/callback',
};

export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<OAuthTokenResponse> {
  debugLog('Exchanging authorization code for tokens', { code: code.substring(0, 10) + '...', state });

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: 'demo-secret', // In production, this should be handled by a backend
    state
  });

  try {
    const response = await ky.post(`${config.wpBaseUrl}/wp-json/oauth2/v1/token`, {
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json<OAuthTokenResponse>();

    debugLog('Token exchange successful', {
      token_type: response.token_type,
      expires_in: response.expires_in,
      has_refresh_token: !!response.refresh_token
    });

    return response;
  } catch (error) {
    debugLog('Token exchange failed', error);
    throw new Error('Failed to exchange code for tokens');
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  debugLog('Refreshing access token');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: 'demo-secret',
  });

  try {
    const response = await ky.post(`${config.wpBaseUrl}/wp-json/oauth2/v1/token`, {
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json<OAuthTokenResponse>();

    debugLog('Token refresh successful', { expires_in: response.expires_in });
    return response;
  } catch (error) {
    debugLog('Token refresh failed', error);
    throw new Error('Failed to refresh access token');
  }
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  debugLog('Fetching user info');

  try {
    const response = await ky.get(`${config.wpBaseUrl}/wp-json/oauth2/v1/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }).json<UserInfo>();

    debugLog('User info retrieved', { id: response.id, username: response.username });
    return response;
  } catch (error) {
    debugLog('Failed to fetch user info', error);
    throw new Error('Failed to fetch user information');
  }
}

export async function makeAuthenticatedRequest<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  debugLog('Making authenticated request', { url });

  try {
    const response = await ky(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }).json<T>();

    return response;
  } catch (error) {
    debugLog('Authenticated request failed', { url, error });
    throw error;
  }
}

export { config as oauthConfig };