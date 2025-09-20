import React, { useEffect, useState } from 'react';

const DebugPage: React.FC = () => {
  const [urlInfo, setUrlInfo] = useState<any>({});

  useEffect(() => {
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);

    setUrlInfo({
      fullUrl: currentUrl,
      pathname: urlObj.pathname,
      search: urlObj.search,
      params: Object.fromEntries(urlObj.searchParams.entries()),
      hash: urlObj.hash,
      host: urlObj.host,
      protocol: urlObj.protocol
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">OAuth2 Debug Information</h2>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Current URL Information</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(urlInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Environment Configuration</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <pre className="text-sm">
{`WordPress URL: ${import.meta.env.VITE_WP_BASE_URL}
Client ID: ${import.meta.env.VITE_OAUTH_CLIENT_ID}
Redirect URI: ${import.meta.env.VITE_OAUTH_REDIRECT_URI}
Debug Enabled: ${import.meta.env.VITE_DEBUG}`}
            </pre>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Session Storage</h3>
          <div className="bg-yellow-50 rounded-lg p-4">
            <pre className="text-sm">
              OAuth State: {sessionStorage.getItem('oauth_state') || 'Not set'}
            </pre>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;