import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import ky from 'ky';

const app = express();
const PORT = process.env.PORT || 3001;

// JWT secrets - In production, use environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key';

// WordPress JWT endpoint - Configure this for your WordPress site
const WP_JWT_ENDPOINT = process.env.WP_JWT_ENDPOINT || 'http://localhost:8080/wp-json/jwt-auth/v1/token';

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
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
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

    // Authenticate with WordPress JWT plugin
    const wpResponse = await ky.post(WP_JWT_ENDPOINT, {
      json: { username, password }
    }).json();

    // Extract user information
    const userPayload = {
      userId: wpResponse.user_id || wpResponse.ID,
      email: wpResponse.user_email,
      nicename: wpResponse.user_nicename,
      displayName: wpResponse.user_display_name,
      wpToken: wpResponse.token // Store WordPress token for API calls
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
      sameSite: 'strict',
      path: '/api',
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
    res.clearCookie('refresh_token', { path: '/api' });
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

  res.clearCookie('refresh_token', { path: '/api' });
  res.json({ message: 'Logged out successfully' });
});

// Verify token middleware (for protected routes)
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔐 JWT Auth Server running on port ${PORT}`);
  console.log(`📋 WordPress JWT endpoint: ${WP_JWT_ENDPOINT}`);
  console.log(`🌐 CORS allowed origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});