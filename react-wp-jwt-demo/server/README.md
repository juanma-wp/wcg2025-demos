# JWT Auth Server

This is a secure authentication server that implements the modern hybrid approach for JWT management:

- **Access tokens** stored in memory (React app)
- **Refresh tokens** stored in HttpOnly cookies

## Security Features

✅ **Access token in memory** - Prevents XSS attacks
✅ **Refresh token in HttpOnly cookie** - Persistent login, XSS-safe
✅ **Automatic token refresh** - Silent re-authentication
✅ **Token revocation** - Proper logout and session management
✅ **CORS configuration** - Secure cross-origin requests

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```env
# Generate secure random strings for production
ACCESS_TOKEN_SECRET=your-secure-access-token-secret-key-here
REFRESH_TOKEN_SECRET=your-secure-refresh-token-secret-key-here

# Your WordPress JWT endpoint
WP_JWT_ENDPOINT=http://localhost:8080/wp-json/jwt-auth/v1/token

# Client URL for CORS (your React app)
CLIENT_URL=http://localhost:5173

# Server port
PORT=3001
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### `POST /api/login`
Authenticates user and returns access token + sets refresh token cookie.

**Request:**
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "nicename": "username",
    "displayName": "Display Name"
  },
  "expires_in": 900
}
```

### `POST /api/refresh`
Refreshes access token using refresh token cookie.

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "expires_in": 900
}
```

### `POST /api/logout`
Clears refresh token cookie and invalidates session.

### `GET /api/me`
Protected route that returns user information (requires Bearer token).

### `GET /api/health`
Health check endpoint.

## Token Lifecycle

1. **Login**: User provides credentials → Server validates with WordPress → Issues access token (to React) + refresh token (HttpOnly cookie)

2. **API Requests**: React uses access token in Authorization header

3. **Token Expiry**: When access token expires (15 min), React automatically calls `/api/refresh` using the HttpOnly cookie

4. **Logout**: Client calls `/api/logout` → Server clears cookie and invalidates refresh token

## Security Considerations

- Access tokens are short-lived (15 minutes)
- Refresh tokens are long-lived (7 days)
- Refresh tokens stored in HttpOnly cookies (not accessible to JavaScript)
- CORS configured for specific client origin
- All tokens are cryptographically signed
- Refresh tokens can be revoked server-side

## Production Deployment

1. Use strong, unique secrets for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
2. Set `NODE_ENV=production`
3. Use HTTPS (refresh token cookies will be secure)
4. Configure proper CORS origins
5. Consider using Redis or database for refresh token storage instead of in-memory Set
6. Add rate limiting and request validation