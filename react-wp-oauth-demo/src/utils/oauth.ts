export interface OAuthConfig {
  wpBaseUrl: string;
  clientId: string;
  clientSecret?: string; // Optional when using PKCE
  redirectUri: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
}

/**
 * Generate a cryptographically secure code verifier for PKCE
 * Must be between 43-128 characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate code challenge from verifier using S256 method (SHA-256)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Build authorization URL with PKCE parameters
 */
export async function buildAuthorizationUrl(
  config: OAuthConfig,
  state: string,
  scopes: string[] = ['read', 'write'],
  codeChallenge?: string
): Promise<string> {
  const params = new URLSearchParams({
    oauth2_authorize: '1',
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: state,
    scope: scopes.join(' ')
  });

  // Add PKCE parameters if code challenge is provided
  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  return `${config.wpBaseUrl}/?${params.toString()}`;
}

export function parseCallbackParams(url: string): { code?: string; state?: string; error?: string } {
  const urlObj = new URL(url);
  return {
    code: urlObj.searchParams.get('code') || undefined,
    state: urlObj.searchParams.get('state') || undefined,
    error: urlObj.searchParams.get('error') || undefined,
  };
}

export function debugLog(message: string, data?: any) {
  if (import.meta.env.VITE_DEBUG === 'true') {
    console.log(`🔍 OAuth Debug: ${message}`, data || '');
  }
}

export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'read': 'View your posts, pages, and profile information',
  'write': 'Create and edit posts and pages',
  'delete': 'Delete posts and pages',
  'upload_files': 'Upload and manage media files',
  'moderate_comments': 'Moderate and manage comments',
  'manage_categories': 'Create and manage categories and tags',
  'manage_users': 'View and manage user accounts',
  'customize': 'Modify theme settings and customizations',
  'install_plugins': 'Install and activate plugins',
  'edit_theme': 'Edit theme files and templates'
};