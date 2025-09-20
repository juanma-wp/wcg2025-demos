import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  oauthConfig
} from '../api/oauth';
import {
  buildAuthorizationUrl,
  generateState,
  parseCallbackParams,
  debugLog,
  UserInfo
} from '../utils/oauth';

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  grantedScopes: string[];
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (scopes?: string[]) => void;
  logout: () => void;
  handleCallback: (url: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    grantedScopes: [],
    loading: true,
    error: null,
  });

  // Use ref to track if callback is being processed
  const isProcessingCallback = React.useRef(false);

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      debugLog('Initializing authentication state');

      const storedToken = localStorage.getItem('oauth_access_token');
      const refreshToken = localStorage.getItem('oauth_refresh_token');
      const storedScopes = localStorage.getItem('oauth_granted_scopes');
      const grantedScopes = storedScopes ? JSON.parse(storedScopes) : [];

      if (storedToken) {
        try {
          // Try to get user info with existing token
          const user = await getUserInfo(storedToken);
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user,
            accessToken: storedToken,
            grantedScopes,
            loading: false,
          }));
          debugLog('Authentication restored from storage');
        } catch (error) {
          // Token might be expired, try to refresh if we have a refresh token
          if (refreshToken) {
            try {
              debugLog('Access token expired, attempting refresh');
              const tokenResponse = await refreshAccessToken(refreshToken);
              const user = await getUserInfo(tokenResponse.access_token);

              localStorage.setItem('oauth_access_token', tokenResponse.access_token);
              if (tokenResponse.refresh_token) {
                localStorage.setItem('oauth_refresh_token', tokenResponse.refresh_token);
              }

              setState(prev => ({
                ...prev,
                isAuthenticated: true,
                user,
                accessToken: tokenResponse.access_token,
                grantedScopes,
                loading: false,
              }));
              debugLog('Token refreshed successfully');
            } catch (refreshError) {
              // Refresh failed, clear storage and require new login
              debugLog('Token refresh failed, clearing storage');
              localStorage.removeItem('oauth_access_token');
              localStorage.removeItem('oauth_refresh_token');
              localStorage.removeItem('oauth_granted_scopes');
              setState(prev => ({ ...prev, loading: false }));
            }
          } else {
            // No refresh token, clear invalid access token
            localStorage.removeItem('oauth_access_token');
            setState(prev => ({ ...prev, loading: false }));
          }
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = (scopes: string[] = ['read', 'write', 'upload_files']) => {
    debugLog('Initiating OAuth login flow', { requestedScopes: scopes });

    const state = generateState();
    sessionStorage.setItem('oauth_state', state);
    // Also store in localStorage as fallback for development hot reloading
    localStorage.setItem('oauth_state_fallback', state);

    const authUrl = buildAuthorizationUrl(oauthConfig, state, scopes);
    debugLog('Redirecting to authorization URL', { authUrl, scopes });

    window.location.href = authUrl;
  };

  const handleCallback = async (callbackUrl: string): Promise<boolean> => {
    // Prevent concurrent callback processing
    if (isProcessingCallback.current) {
      debugLog('Callback already being processed, skipping', { url: callbackUrl });
      return true;
    }

    isProcessingCallback.current = true;

    try {
      debugLog('Handling OAuth callback', { url: callbackUrl });

      const { code, state: returnedState, error } = parseCallbackParams(callbackUrl);
      let expectedState = sessionStorage.getItem('oauth_state');

      // Fallback to localStorage if sessionStorage is empty (common during development hot reloading)
      if (!expectedState) {
        expectedState = localStorage.getItem('oauth_state_fallback');
        debugLog('Using fallback state from localStorage', { fallbackState: expectedState });
      }

      debugLog('Callback parameters parsed', { code, state: returnedState, error, expectedState });

      if (error) {
        debugLog('OAuth error received', { error });
        setState(prev => ({
          ...prev,
          error: `OAuth error: ${error}`,
          loading: false,
        }));
        return false;
      }

      if (!code) {
        debugLog('No authorization code found in callback URL', {
          fullUrl: callbackUrl,
          parsedParams: { code, state: returnedState, error }
        });
        setState(prev => ({
          ...prev,
          error: 'No authorization code received',
          loading: false,
        }));
        return false;
      }

      // Check if this code has already been processed
      const processedCode = sessionStorage.getItem('oauth_processed_code');
      if (processedCode === code) {
        debugLog('Authorization code already processed, skipping', { code: code.substring(0, 10) + '...' });
        return true; // Return success to avoid error state
      }

      if (returnedState !== expectedState) {
        debugLog('State mismatch', {
          expected: expectedState,
          received: returnedState,
          sessionStorageKeys: Object.keys(sessionStorage),
          allSessionStorage: Object.fromEntries(Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)]))
        });
        setState(prev => ({
          ...prev,
          error: `Invalid state parameter. Expected: ${expectedState}, Received: ${returnedState}`,
          loading: false,
        }));
        return false;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const tokenResponse = await exchangeCodeForToken(code, returnedState || '');
      const user = await getUserInfo(tokenResponse.access_token);

      // Parse granted scopes from token response
      const grantedScopes = tokenResponse.scope ? tokenResponse.scope.split(' ').filter(scope => scope.length > 0) : [];

      // Mark this code as processed to prevent reuse
      sessionStorage.setItem('oauth_processed_code', code);

      // Store tokens and granted scopes
      localStorage.setItem('oauth_access_token', tokenResponse.access_token);
      localStorage.setItem('oauth_granted_scopes', JSON.stringify(grantedScopes));
      if (tokenResponse.refresh_token) {
        localStorage.setItem('oauth_refresh_token', tokenResponse.refresh_token);
      }

      // Clear state from session storage and localStorage fallback
      sessionStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_state_fallback');

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        accessToken: tokenResponse.access_token,
        grantedScopes,
        loading: false,
        error: null,
      }));

      debugLog('OAuth callback handled successfully', { userId: user.id });
      return true;

    } catch (error) {
      debugLog('OAuth callback failed', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication failed',
        loading: false,
      }));
      return false;
    } finally {
      // Always reset the processing flag
      isProcessingCallback.current = false;
    }
  };

  const logout = () => {
    debugLog('Logging out user');

    localStorage.removeItem('oauth_access_token');
    localStorage.removeItem('oauth_refresh_token');
    localStorage.removeItem('oauth_granted_scopes');
    localStorage.removeItem('oauth_state_fallback');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_processed_code');

    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      grantedScopes: [],
      loading: false,
      error: null,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        handleCallback,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};