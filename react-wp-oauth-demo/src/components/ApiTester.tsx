import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { makeAuthenticatedRequest, oauthConfig } from '../api/oauth';

interface ApiAction {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requiredScope: string;
  testData?: any;
}

const apiActions: ApiAction[] = [
  {
    id: 'read-posts',
    name: 'Read Posts',
    description: 'Fetch a list of published posts',
    method: 'GET',
    endpoint: '/wp-json/wp/v2/posts?per_page=3',
    requiredScope: 'read'
  },
  {
    id: 'read-user',
    name: 'Read User Profile',
    description: 'Get current user information',
    method: 'GET',
    endpoint: '/wp-json/wp/v2/users/me',
    requiredScope: 'read'
  },
  {
    id: 'create-post',
    name: 'Create Post',
    description: 'Create a new blog post',
    method: 'POST',
    endpoint: '/wp-json/wp/v2/posts',
    requiredScope: 'write',
    testData: {
      title: 'Test Post from OAuth Demo',
      content: 'This post was created via the WordPress REST API using OAuth2 authentication.',
      status: 'draft'
    }
  },
  {
    id: 'upload-media',
    name: 'Upload Media Info',
    description: 'Get media upload information',
    method: 'GET',
    endpoint: '/wp-json/wp/v2/media?per_page=3',
    requiredScope: 'upload_files'
  },
  {
    id: 'manage-comments',
    name: 'Read Comments',
    description: 'Fetch recent comments',
    method: 'GET',
    endpoint: '/wp-json/wp/v2/comments?per_page=5',
    requiredScope: 'moderate_comments'
  },
  {
    id: 'delete-post',
    name: 'Delete Post (Simulation)',
    description: 'This would delete a post (simulated - no actual deletion)',
    method: 'DELETE',
    endpoint: '/wp-json/wp/v2/posts/1',
    requiredScope: 'delete'
  }
];

const ApiTester: React.FC = () => {
  const { accessToken, grantedScopes } = useAuth();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const hasPermission = (requiredScope: string) => {
    return grantedScopes.includes(requiredScope);
  };

  const testAction = async (action: ApiAction) => {
    if (!accessToken) return;

    setLoading(prev => ({ ...prev, [action.id]: true }));
    setResults(prev => ({ ...prev, [action.id]: null }));

    try {
      let response;
      const fullUrl = `${oauthConfig.wpBaseUrl}${action.endpoint}`;

      if (action.method === 'POST' && action.testData) {
        response = await makeAuthenticatedRequest<any>(fullUrl, accessToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.testData),
        });
      } else {
        response = await makeAuthenticatedRequest<any>(fullUrl, accessToken, {
          method: action.method,
        });
      }

      setResults(prev => ({
        ...prev,
        [action.id]: {
          success: true,
          data: response,
          message: `✅ Success! Retrieved ${Array.isArray(response) ? response.length : 1} item(s)`
        }
      }));
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      let detailedMessage = '';
      let serverErrorDetails = null;

      if (error.response) {
        const status = error.response.status;

        // Try to parse detailed error response from server
        let serverResponse = null;
        try {
          serverResponse = error.response.json ? await error.response.json() : null;
        } catch (e) {
          // Ignore JSON parsing errors
        }

        if (status === 401) {
          errorMessage = 'Unauthorized - Invalid or expired token';
          detailedMessage = serverResponse?.message || 'The access token is invalid or has expired.';
        } else if (status === 403) {
          if (serverResponse?.code === 'rest_forbidden_scope' || serverResponse?.oauth2_error === 'insufficient_scope') {
            errorMessage = 'OAuth2 Scope Insufficient';
            detailedMessage = serverResponse.message || `You don't have the required "${action.requiredScope}" permission for this action.`;
            serverErrorDetails = {
              requiredScopes: serverResponse.required_scopes,
              tokenScopes: serverResponse.token_scopes,
              oauth2Error: serverResponse.oauth2_error,
              help: serverResponse.help
            };
          } else {
            errorMessage = 'Forbidden - Insufficient permissions';
            detailedMessage = serverResponse?.message || `You don't have the required "${action.requiredScope}" permission for this action.`;
          }
        } else if (status === 404) {
          errorMessage = 'Not Found - Endpoint does not exist';
          detailedMessage = 'The API endpoint was not found.';
        } else {
          errorMessage = `HTTP ${status} - ${error.response.statusText || 'Server error'}`;
          detailedMessage = serverResponse?.message || `Server returned status code ${status}.`;
        }
      } else if (error.message) {
        errorMessage = error.message;
        detailedMessage = 'Network or request error occurred.';
      }

      setResults(prev => ({
        ...prev,
        [action.id]: {
          success: false,
          error: errorMessage,
          detailedMessage,
          serverErrorDetails,
          httpStatus: error.response?.status,
          message: `❌ ${errorMessage}`,
          isPermissionError: error.response?.status === 403
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [action.id]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">API Permission Testing</h3>
      <p className="text-gray-600 text-sm mb-6">
        Test different WordPress REST API actions to see how permissions are enforced.
        Actions will only work if you've been granted the required permission.
      </p>

      <div className="space-y-4">
        {apiActions.map((action) => {
          const canPerform = hasPermission(action.requiredScope);
          const result = results[action.id];
          const isLoading = loading[action.id];

          return (
            <div key={action.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{action.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      action.method === 'GET' ? 'bg-green-100 text-green-800' :
                      action.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      action.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {action.method}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      canPerform ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {canPerform ? '✓ Granted' : '✗ Missing'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{action.description}</p>
                  <p className="text-xs text-gray-400">
                    Requires: <code className="bg-gray-100 px-1 rounded">{action.requiredScope}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testAction(action)}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isLoading
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : canPerform
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isLoading ? 'Testing...' : canPerform ? 'Test API' : 'Try Without Permission'}
                  </button>
                </div>
              </div>

              {!canPerform && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-orange-800 font-medium">Missing Permission</p>
                      <p className="text-orange-700 text-xs">
                        You need the <strong>{action.requiredScope}</strong> permission to perform this action successfully.
                        Click "Try Without Permission" to see how the WordPress API rejects unauthorized requests.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className={`mt-3 p-3 rounded text-sm border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : result.isPermissionError
                    ? 'bg-red-50 border-red-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start">
                    <div className={`mr-2 mt-0.5 ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.success ? '✅' : '❌'}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </p>

                      {!result.success && result.detailedMessage && (
                        <p className="text-red-700 text-xs mt-1">
                          {result.detailedMessage}
                        </p>
                      )}

                      {result.isPermissionError && !canPerform && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs">
                          <strong>OAuth2 Security in Action:</strong> This demonstrates how WordPress protects resources.
                          Even though you may have admin privileges, the API correctly rejected this request because
                          the OAuth2 token doesn't include the "{action.requiredScope}" scope.

                          {result.serverErrorDetails && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <div className="font-semibold mb-1">Server Response Details:</div>
                              <div><strong>Required:</strong> {result.serverErrorDetails.requiredScopes?.join(', ') || 'N/A'}</div>
                              <div><strong>Your Token Has:</strong> {result.serverErrorDetails.tokenScopes?.length ? result.serverErrorDetails.tokenScopes.join(', ') : 'No scopes'}</div>
                              {result.serverErrorDetails.help && (
                                <div className="mt-1 text-gray-600"><strong>Help:</strong> {result.serverErrorDetails.help}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {result.httpStatus && (
                        <p className="text-gray-600 text-xs mt-1">
                          HTTP Status: {result.httpStatus}
                        </p>
                      )}
                    </div>
                  </div>

                  {result.data && result.success && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800 font-medium">
                        📄 View API Response Data
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 border rounded overflow-auto max-h-32 text-gray-700">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Key OAuth2 Security Concept</h4>
            <p className="text-sm text-yellow-800">
              Even if you're logged in as an admin user with full WordPress permissions,
              this app can only perform actions you've explicitly granted it permission for.
              This is the core security benefit of OAuth2 - apps get limited, user-approved access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;