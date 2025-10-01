import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  logout as logoutApi,
  oauthConfig
} from '../api/oauth';
import {
  buildAuthorizationUrl,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  parseCallbackParams,
  UserInfo
} from '../utils/oauth';
import { createSingleton } from '../lib/singleton';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  grantedScopes: string[];
  loading: boolean;
  error: string | null;
  login: (scopes?: string[]) => void;
  logout: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  const isProcessingCallback = useRef(false);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    clearRefreshTimeout();
    const refreshTime = Math.min(expiresIn - 120, expiresIn * 0.9) * 1000;

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const tokenResponse = await refreshAccessToken();
        const userData = await getUserInfo(tokenResponse.access_token);
        setAccessToken(tokenResponse.access_token);
        setUser(userData);
        const scopes = tokenResponse.scope ? tokenResponse.scope.split(' ').filter(scope => scope.length > 0) : [];
        setGrantedScopes(scopes);
        scheduleRefresh(tokenResponse.expires_in);
      } catch {
        setAccessToken(null);
        setUser(null);
        setGrantedScopes([]);
      }
    }, refreshTime);
  }, [clearRefreshTimeout]);

  // Silent login on app load - singleton ensures it only runs once per reload
  useEffect(() => {
    // Create a singleton for the actual silent login attempt
    const attemptSilentLogin = createSingleton(async () => {
      try {
        const tokenResponse = await refreshAccessToken();
        const userData = await getUserInfo(tokenResponse.access_token);
        
        setAccessToken(tokenResponse.access_token);
        setUser(userData);
        
        const scopes = tokenResponse.scope ? tokenResponse.scope.split(' ').filter(scope => scope.length > 0) : [];
        setGrantedScopes(scopes);
        scheduleRefresh(tokenResponse.expires_in);
      } catch {
        // Silent failure is expected on first visit
      } finally {
        // Mark auth check as completed
        setAuthCheckCompleted(true);
      }
    });

    attemptSilentLogin();
  }, []);

  // Manage loading state based on auth check completion
  useEffect(() => {
    if (authCheckCompleted) {
      setLoading(false);
    }
  }, [authCheckCompleted]);

  const login = async (scopes: string[] = ['read', 'write', 'upload_files']) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const authUrl = await buildAuthorizationUrl(oauthConfig, state, scopes, codeChallenge);
    window.location.href = authUrl;
  };

  const handleCallback = useCallback(async (callbackUrl: string): Promise<boolean> => {
    if (isProcessingCallback.current) return true;
    isProcessingCallback.current = true;

    try {
      const { code, state: returnedState, error } = parseCallbackParams(callbackUrl);
      const expectedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (error) {
        setError(`OAuth2 error: ${error}`);
        setLoading(false);
        return false;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        return false;
      }

      const processedCode = sessionStorage.getItem('oauth_processed_code');
      if (processedCode === code) return true;

      if (returnedState !== expectedState) {
        setError('Invalid state parameter');
        setLoading(false);
        return false;
      }

      if (!codeVerifier) {
        setError('PKCE code verifier not found');
        setLoading(false);
        return false;
      }

      setLoading(true);
      setError(null);

      const tokenResponse = await exchangeCodeForToken(code, returnedState || '', codeVerifier);
      const userData = await getUserInfo(tokenResponse.access_token);
      const scopes = tokenResponse.scope ? tokenResponse.scope.split(' ').filter(scope => scope.length > 0) : [];

      sessionStorage.setItem('oauth_processed_code', code);
      setAccessToken(tokenResponse.access_token);
      setUser(userData);
      setGrantedScopes(scopes);
      setLoading(false);
      setError(null);
      scheduleRefresh(tokenResponse.expires_in);
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('pkce_code_verifier');

      return true;

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setLoading(false);
      return false;
    } finally {
      isProcessingCallback.current = false;
    }
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearRefreshTimeout();
      setAccessToken(null);
      setUser(null);
      setGrantedScopes([]);
      setError(null);
      setLoading(false);
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_processed_code');
      sessionStorage.removeItem('pkce_code_verifier');
    }
  }, [clearRefreshTimeout]);

  const clearError = useCallback(() => setError(null), []);
  const isAuthenticated = !!accessToken && !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        grantedScopes,
        loading,
        error,
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