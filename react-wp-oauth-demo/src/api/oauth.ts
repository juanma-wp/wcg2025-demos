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
    }).json<any>();

    // Handle wp-rest-auth-multi plugin response format
    const tokenData = response.data || response;

    const tokenResponse: OAuthTokenResponse = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    };

    debugLog('Token exchange successful', {
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      has_refresh_token: !!tokenResponse.refresh_token
    });

    return tokenResponse;
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
    }).json<any>();

    // Handle wp-rest-auth-multi plugin response format
    const tokenData = response.data || response;

    const tokenResponse: OAuthTokenResponse = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope
    };

    debugLog('Token refresh successful', { expires_in: tokenResponse.expires_in });
    return tokenResponse;
  } catch (error) {
    debugLog('Token refresh failed', error);
    throw new Error('Failed to refresh access token');
  }
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  debugLog('Fetching user info');

  try {
    // Try OAuth2 userinfo endpoint first
    let response;
    let userData;

    try {
      response = await ky.get(`${config.wpBaseUrl}/wp-json/oauth2/v1/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }).json<any>();

      debugLog('OAuth2 userinfo response', { response });
      userData = response.data || response;

    } catch (oauth2Error) {
      debugLog('OAuth2 userinfo failed, trying WordPress REST API /users/me', oauth2Error);

      try {
        // Fallback to standard WordPress REST API
        response = await ky.get(`${config.wpBaseUrl}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }).json<any>();

        debugLog('WordPress REST API /users/me response', { response });
        userData = response.data || response;

      } catch (wpApiError) {
        debugLog('WordPress REST API /users/me also failed, trying JWT plugin endpoint', wpApiError);

        // Third fallback: try JWT plugin user endpoint
        response = await ky.get(`${config.wpBaseUrl}/wp-json/jwt-auth/v1/token/validate`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }).json<any>();

        debugLog('JWT validate response', { response });
        userData = response.data || response;
      }
    }

    debugLog('Final parsed userData', { userData });

    // Handle nested user data structure from wp-rest-auth-multi
    const user = userData.user || userData;

    const userInfo: UserInfo = {
      id: user.id || user.ID || user.user_id || userData.user_id,
      username: user.username || user.user_login || user.user_nicename || user.slug,
      email: user.email || user.user_email,
      display_name: user.display_name || user.name || user.username || user.user_login,
      roles: user.roles || []
    };

    debugLog('Final userInfo object', {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      display_name: userInfo.display_name,
      roles: userInfo.roles
    });

    return userInfo;
  } catch (error) {
    debugLog('Failed to fetch user info from both endpoints', error);
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