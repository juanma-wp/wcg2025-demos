import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import ky from 'ky';
import https from 'https';
import { config } from 'dotenv';

// Load environment variables
config();

// Set Node.js to ignore SSL certificate errors for development
if (process.env.SSL_VERIFY === 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create a simple ky client for WordPress API calls
const wpApiClient = ky.create();

const app = express();
const PORT = process.env.PORT || 3001;

// JWT secrets - In production, use environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key';

// WordPress configuration - explicit endpoint construction
const WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8080';
const WP_API_NAMESPACE = process.env.WP_API_NAMESPACE || 'wp-json';
const WP_JWT_NAMESPACE = process.env.WP_JWT_NAMESPACE || 'jwt-auth/v1';

// JWT endpoint paths
const WP_JWT_TOKEN_ENDPOINT = process.env.WP_JWT_TOKEN_ENDPOINT || '/token';
const WP_JWT_REFRESH_ENDPOINT = process.env.WP_JWT_REFRESH_ENDPOINT || '/refresh';
const WP_JWT_VERIFY_ENDPOINT = process.env.WP_JWT_VERIFY_ENDPOINT || '/verify';
const WP_JWT_LOGOUT_ENDPOINT = process.env.WP_JWT_LOGOUT_ENDPOINT || '/logout';

// Construct full URLs
const buildWpUrl = (endpoint) => {
  const baseUrl = WP_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/${WP_API_NAMESPACE}/${WP_JWT_NAMESPACE}${endpoint}`;
};

const WP_JWT_TOKEN_URL = buildWpUrl(WP_JWT_TOKEN_ENDPOINT);
const WP_JWT_REFRESH_URL = buildWpUrl(WP_JWT_REFRESH_ENDPOINT);
const WP_JWT_VERIFY_URL = buildWpUrl(WP_JWT_VERIFY_ENDPOINT);
const WP_JWT_LOGOUT_URL = buildWpUrl(WP_JWT_LOGOUT_ENDPOINT);

// Store active refresh tokens (in production, use Redis or database)
const activeRefreshTokens = new Set();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Helper functions
function generateAccessToken(userPayload) {
  return jwt.sign(userPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m' // Short-lived access token
  });
}

function generateRefreshToken(userPayload) {
  return jwt.sign(userPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d' // Long-lived refresh token
  });
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (process.env.DEBUG === 'true') {
      console.log('🔍 verifyAccessToken - Token valid, payload:', {
        userId: payload.userId,
        exp: payload.exp,
        iat: payload.iat
      });
    }
    return payload;
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.log('🔍 verifyAccessToken - Token verification failed:', error.message);
    }
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

// Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (process.env.DEBUG === 'true') {
      console.log(`🔍 Attempting WordPress authentication at: ${WP_JWT_TOKEN_URL}`);
      console.log(`🔍 Username: ${username}`);
    }

    // Authenticate with WordPress JWT plugin
    const wpResponse = await wpApiClient.post(WP_JWT_TOKEN_URL, {
      json: { username, password }
    }).json();

    if (process.env.DEBUG === 'true') {
      console.log('🔍 WordPress response:', wpResponse);
    }

    // Extract user information
    const userPayload = {
      userId: wpResponse.user?.id || wpResponse.user_id || wpResponse.ID,
      email: wpResponse.user?.email || wpResponse.user_email,
      nicename: wpResponse.user?.username || wpResponse.user_nicename,
      displayName: wpResponse.user?.username || wpResponse.user_display_name,
      wpToken: wpResponse.access_token || wpResponse.token // Store WordPress token for API calls
    };

    // Generate our own tokens
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // Store refresh token
    activeRefreshTokens.add(refreshToken);

    // Set refresh token as HttpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      path: '/', // Changed from '/api' to '/' to ensure it's sent with all requests
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return access token and user info (NOT the refresh token)
    res.json({
      access_token: accessToken,
      user: {
        id: userPayload.userId,
        email: userPayload.email,
        nicename: userPayload.nicename,
        displayName: userPayload.displayName
      },
      expires_in: 900 // 15 minutes
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error.response) {
      // WordPress returned an error
      const wpError = await error.response.json();
      return res.status(error.response.status).json({
        error: wpError.message || 'Authentication failed'
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
app.post('/api/refresh', (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken || !activeRefreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    activeRefreshTokens.delete(refreshToken);
    res.clearCookie('refresh_token', { path: '/' }); // Match the path used when setting
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    nicename: payload.nicename,
    displayName: payload.displayName,
    wpToken: payload.wpToken
  });

  res.json({
    access_token: newAccessToken,
    expires_in: 900 // 15 minutes
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (refreshToken) {
    activeRefreshTokens.delete(refreshToken);
  }

  res.clearCookie('refresh_token', { path: '/' }); // Match the path used when setting
  res.json({ message: 'Logged out successfully' });
});

// Verify token middleware (for protected routes)
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (process.env.DEBUG === 'true') {
    console.log(`🔍 verifyToken - Auth header: ${authHeader ? 'Bearer ' + token?.substring(0, 20) + '...' : 'none'}`);
  }

  if (!token) {
    console.log('🔍 verifyToken - No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    console.log('🔍 verifyToken - Token verification failed');
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  if (process.env.DEBUG === 'true') {
    console.log('🔍 verifyToken - Success, user:', payload.userId);
  }

  req.user = payload;
  next();
}

// Protected route example
app.get('/api/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      email: req.user.email,
      nicename: req.user.nicename,
      displayName: req.user.displayName
    }
  });
});

// WordPress API proxy - forwards authenticated requests to WordPress
app.get('/api/wp/*', verifyToken, async (req, res) => {
  try {
    const wpPath = req.params[0]; // Everything after /api/wp/
    const wpUrl = `${WP_BASE_URL.replace(/\/$/, '')}/wp-json/${wpPath}`;

    // Use the WordPress token from the JWT payload
    const wpToken = req.user.wpToken;

    if (process.env.DEBUG === 'true') {
      console.log(`🔍 Proxying to WordPress: ${wpUrl}`);
      console.log(`🔍 Using WP token: ${wpToken ? wpToken.substring(0, 20) + '...' : 'none'}`);
    }

    const wpResponse = await wpApiClient.get(wpUrl, {
      headers: wpToken ? { Authorization: `Bearer ${wpToken}` } : {},
      searchParams: req.query,
      throwHttpErrors: false
    });

    const data = await wpResponse.text();

    // Forward the status and content type
    res.status(wpResponse.status);
    res.set('Content-Type', wpResponse.headers.get('content-type') || 'application/json');
    res.send(data);

  } catch (error) {
    console.error('WordPress proxy error:', error);
    res.status(500).json({ error: 'WordPress API proxy failed' });
  }
});

// WordPress API proxy for POST requests
app.post('/api/wp/*', verifyToken, async (req, res) => {
  try {
    const wpPath = req.params[0];
    const wpUrl = `${WP_BASE_URL.replace(/\/$/, '')}/wp-json/${wpPath}`;

    const wpToken = req.user.wpToken;

    if (process.env.DEBUG === 'true') {
      console.log(`🔍 Proxying POST to WordPress: ${wpUrl}`);
      console.log(`🔍 Using WP token: ${wpToken ? wpToken.substring(0, 20) + '...' : 'none'}`);
    }

    const wpResponse = await wpApiClient.post(wpUrl, {
      json: req.body,
      headers: wpToken ? { Authorization: `Bearer ${wpToken}` } : {},
      throwHttpErrors: false
    });

    const data = await wpResponse.text();

    res.status(wpResponse.status);
    res.set('Content-Type', wpResponse.headers.get('content-type') || 'application/json');
    res.send(data);

  } catch (error) {
    console.error('WordPress proxy error:', error);
    res.status(500).json({ error: 'WordPress API proxy failed' });
  }
});

// Test WordPress connection
app.get('/api/test-wp', async (req, res) => {
  try {
    console.log(`🔍 Testing WordPress connection at: ${WP_JWT_TOKEN_URL}`);

    const response = await wpApiClient.post(WP_JWT_TOKEN_URL, {
      json: { username: 'test', password: 'test' },
      throwHttpErrors: false
    });

    const text = await response.text();
    console.log(`🔍 WordPress test response status: ${response.status}`);
    console.log(`🔍 WordPress test response body: ${text}`);

    res.json({
      status: 'test_complete',
      wp_endpoint: WP_JWT_TOKEN_URL,
      wp_status: response.status,
      wp_response: text,
      ssl_verify: process.env.SSL_VERIFY !== 'false'
    });
  } catch (error) {
    console.error('🔍 WordPress test failed:', error);
    res.status(500).json({
      error: 'WordPress connection failed',
      details: error.message,
      endpoint: WP_JWT_TOKEN_URL
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔐 JWT Auth Server running on port ${PORT}`);
  console.log(`📋 WordPress base URL: ${WP_BASE_URL}`);
  console.log(`🔧 API namespace: ${WP_API_NAMESPACE}`);
  console.log(`🏷️  JWT namespace: ${WP_JWT_NAMESPACE}`);
  console.log(`🎯 Token endpoint: ${WP_JWT_TOKEN_URL}`);
  console.log(`🔄 Refresh endpoint: ${WP_JWT_REFRESH_URL}`);
  console.log(`✅ Verify endpoint: ${WP_JWT_VERIFY_URL}`);
  console.log(`🚪 Logout endpoint: ${WP_JWT_LOGOUT_URL}`);
  console.log(`🌐 CORS allowed origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🐛 Debug mode: ${process.env.DEBUG || 'false'}`);
  console.log(`🔒 SSL verification: ${process.env.SSL_VERIFY !== 'false' ? 'enabled' : 'disabled (dev mode)'}`);
});