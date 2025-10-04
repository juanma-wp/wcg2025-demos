import ky from 'ky';
import { OAuthConfig, OAuthTokenResponse, UserInfo } from '../utils/oauth';

const config: OAuthConfig = {
  wpBaseUrl: import.meta.env.VITE_WP_BASE_URL,
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
  clientSecret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
};

export async function exchangeCodeForToken(
  code: string,
  state: string,
  codeVerifier?: string
): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    state
  });

  // Use PKCE if code_verifier is provided, otherwise fall back to client_secret
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  } else if (config.clientSecret) {
    body.append('client_secret', config.clientSecret);
  }

  try {
    const response = await ky.post(`${config.wpBaseUrl}/wp-json/oauth2/v1/token`, {
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include'
    }).json<any>();

    const tokenData = response.data || response;

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    };
  } catch (error) {
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

export async function refreshAccessToken(): Promise<OAuthTokenResponse> {
  try {
    const response = await ky.post(`${config.wpBaseUrl}/wp-json/oauth2/v1/refresh`, {
      credentials: 'include'
    }).json<any>();

    const tokenData = response.data || response;

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    };
  } catch (error) {
    throw new Error('Failed to refresh OAuth2 access token');
  }
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const endpoints = [
    `${config.wpBaseUrl}/wp-json/oauth2/v1/userinfo`,
    `${config.wpBaseUrl}/wp-json/wp/v2/users/me`,
    `${config.wpBaseUrl}/wp-json/jwt-auth/v1/token/validate`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await ky.get(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        credentials: 'include'
      }).json<any>();

      const userData = response.data || response;
      const user = userData.user || userData;

      return {
        id: user.id || user.ID || user.user_id || userData.user_id,
        username: user.username || user.user_login || user.user_nicename || user.slug,
        email: user.email || user.user_email,
        display_name: user.display_name || user.name || user.username || user.user_login,
        roles: user.roles || []
      };
    } catch {
      continue;
    }
  }

  throw new Error('Failed to fetch user information');
}

export async function logout(): Promise<void> {

  try {
    await ky.post(`${config.wpBaseUrl}/wp-json/oauth2/v1/logout`, {
      credentials: 'include'
    });
  } catch {
    // Ignore errors - logout should always succeed on client side
  }
}

export async function makeAuthenticatedRequest<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  return ky(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }).json<T>();
}

export { config as oauthConfig };