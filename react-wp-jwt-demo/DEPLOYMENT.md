# Production Deployment Guide

This guide covers the production deployment requirements for the React WordPress JWT Demo, which uses a modern hybrid authentication approach with access tokens in memory and refresh tokens in secure HttpOnly cookies.

## 🌐 Production HTTPS Requirements

### 1. React App (Frontend)
**Requirement: HTTPS** ✅ **REQUIRED**

```
https://yourapp.com
```

**Why HTTPS is required:**
- **Secure cookies**: The Express server will set `secure: true` cookies
- **Browser security**: Modern browsers block HTTP→HTTPS requests in many cases
- **User trust**: Users expect HTTPS for any app handling authentication
- **SEO/PWA**: Google requires HTTPS for PWA features and better SEO ranking

### 2. Express Server (Auth/API Server)
**Requirement: HTTPS** ✅ **REQUIRED**

```
https://api.yourapp.com
```

**Why HTTPS is required:**
- **Secure cookie transmission**: With `secure: true`, cookies only sent over HTTPS
- **Cross-origin security**: HTTPS frontend can only make secure requests
- **Token protection**: Access tokens in requests need encryption
- **CORS compliance**: Mixed content (HTTPS→HTTP) is blocked by browsers

### 3. WordPress REST API
**Requirement: HTTPS** ✅ **REQUIRED**

```
https://yourwordpress.com
```

**Why HTTPS is required:**
- **WordPress security**: JWT tokens and user credentials need encryption
- **API reliability**: Your Express server makes requests to WordPress
- **Certificate validation**: Production should validate SSL certificates

## 🏗️ Production Architecture

```
HTTPS Frontend          HTTPS Express Server       HTTPS WordPress
┌─────────────────┐    ┌─────────────────┐       ┌─────────────────┐
│ React App       │    │ Auth Server     │       │ WordPress API   │
│ yourapp.com     │◄──►│ api.yourapp.com │◄─────►│ cms.yourapp.com │
│                 │    │                 │       │                 │
│ - Serves UI     │    │ - JWT tokens    │       │ - Content API   │
│ - No tokens     │    │ - Secure cookies│       │ - User auth     │
│ - API calls     │    │ - WP proxy      │       │ - Posts/data    │
└─────────────────┘    └─────────────────┘       └─────────────────┘
```

## ⚙️ Configuration Changes for Production

### React App (.env.production)
```bash
# Production environment for React
VITE_AUTH_SERVER_URL=https://api.yourapp.com
VITE_WP_BASE_URL=https://cms.yourapp.com
VITE_DEBUG=false
```

### Express Server (.env)
```bash
# JWT Secrets (Generate secure random strings for production)
ACCESS_TOKEN_SECRET=your-production-access-token-secret-key-here
REFRESH_TOKEN_SECRET=your-production-refresh-token-secret-key-here

# WordPress Configuration
WP_BASE_URL=https://cms.yourapp.com/
WP_API_NAMESPACE=wp-json
WP_JWT_NAMESPACE=jwt/v1

# Specific JWT Endpoints
WP_JWT_TOKEN_ENDPOINT=/token
WP_JWT_REFRESH_ENDPOINT=/refresh
WP_JWT_VERIFY_ENDPOINT=/verify
WP_JWT_LOGOUT_ENDPOINT=/logout

# Client Configuration
CLIENT_URL=https://yourapp.com

# Server Configuration
PORT=3001
NODE_ENV=production              # ✅ Enables secure: true cookies

# Debug
DEBUG=false

# SSL Configuration
SSL_VERIFY=true                  # ✅ Validate WordPress SSL certificates
```

### Express Server Cookie Settings (Production)
The following will automatically activate when `NODE_ENV=production`:

```javascript
// server/server.js - This configuration is already in place
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // ✅ true in production
  sameSite: 'lax',  // Can be 'strict' for even better security
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})
```

## 🚫 What Happens Without HTTPS

### Mixed Content Issues:
```
❌ https://yourapp.com → http://api.yourapp.com (BLOCKED)
❌ https://api.yourapp.com → http://cms.yourapp.com (CERTIFICATE_VERIFY_FAILED)
```

### Cookie Issues:
```javascript
// With secure: true, this cookie won't be sent over HTTP
res.cookie('refresh_token', token, {
  secure: true  // ❌ Won't work with HTTP
})
```

## 📋 Production Deployment Checklist

### ✅ SSL Certificates
Get SSL certificates for all domains:
- [ ] React app domain (`yourapp.com`)
- [ ] Express server domain (`api.yourapp.com`)
- [ ] WordPress domain (`cms.yourapp.com`)

### ✅ Environment Variables
Update all environment files with HTTPS URLs:

**React App (.env.production):**
- [ ] Set `VITE_AUTH_SERVER_URL=https://api.yourapp.com`
- [ ] Set `VITE_WP_BASE_URL=https://cms.yourapp.com`
- [ ] Set `VITE_DEBUG=false`

**Express Server (.env):**
- [ ] Set `NODE_ENV=production`
- [ ] Set `SSL_VERIFY=true`
- [ ] Set `WP_BASE_URL=https://cms.yourapp.com`
- [ ] Set `CLIENT_URL=https://yourapp.com`
- [ ] Generate secure random strings for JWT secrets
- [ ] Set `DEBUG=false`

### ✅ CORS Configuration
Update CORS settings in Express server:

```javascript
app.use(cors({
  origin: 'https://yourapp.com',  // ✅ HTTPS origin
  credentials: true
}))
```

### ✅ WordPress Configuration
Ensure WordPress runs on HTTPS:

```php
// wp-config.php
define('FORCE_SSL_ADMIN', true);
define('WP_HOME','https://cms.yourapp.com');
define('WP_SITEURL','https://cms.yourapp.com');
```

### ✅ JWT Plugin Configuration
Ensure your WordPress JWT plugin is properly configured:
- [ ] Plugin is installed and activated
- [ ] JWT secret is set in WordPress
- [ ] REST API endpoints are accessible
- [ ] CORS is configured if needed

## 🌟 Alternative Deployment Patterns

### Option 1: Separate Domains (Recommended)
```
Frontend:  https://myapp.com
API:       https://api.myapp.com
WordPress: https://cms.myapp.com
```

**Pros:**
- Clear separation of concerns
- Easy to scale components independently
- Better security isolation
- Can use different hosting providers

**Cons:**
- More SSL certificates needed
- More complex DNS setup

### Option 2: Subpaths (Single Domain)
```
Frontend:  https://myapp.com/
API:       https://myapp.com/api/
WordPress: https://myapp.com/wp/
```

**Pros:**
- Single SSL certificate
- Simplified CORS (same-origin)
- Single domain to manage

**Cons:**
- More complex reverse proxy setup
- Harder to scale components independently

### Option 3: Internal WordPress (Most Secure)
```
Frontend:  https://myapp.com
API:       https://api.myapp.com
WordPress: https://internal-cms.myapp.com (not public-facing)
```

**Pros:**
- WordPress not directly accessible from internet
- Maximum security
- Express server acts as complete API gateway

**Cons:**
- WordPress admin interface requires VPN/internal access
- More complex deployment

## 🔒 Security Benefits in Production

With full HTTPS deployment:
- ✅ **End-to-end encryption** for all communications
- ✅ **Secure cookies** protect refresh tokens from network interception
- ✅ **Certificate validation** prevents man-in-the-middle attacks
- ✅ **Browser security compliance** (no mixed content warnings)
- ✅ **SEO benefits** and user trust
- ✅ **HttpOnly cookies** prevent XSS attacks
- ✅ **SameSite cookies** prevent CSRF attacks

## 🚀 Deployment Steps Summary

1. **Obtain SSL certificates** for all domains
2. **Update environment variables** with HTTPS URLs
3. **Deploy React app** to HTTPS hosting (Netlify, Vercel, etc.)
4. **Deploy Express server** to HTTPS hosting (Railway, Heroku, DigitalOcean, etc.)
5. **Ensure WordPress** is running on HTTPS
6. **Test authentication flow** end-to-end
7. **Verify secure cookies** are working
8. **Monitor logs** for any HTTPS/certificate issues

## 🔧 Common Production Issues & Solutions

### Issue: "Mixed Content" errors
**Solution:** Ensure ALL components use HTTPS

### Issue: Cookies not being sent
**Solution:** Verify `NODE_ENV=production` and all URLs use HTTPS

### Issue: CORS errors
**Solution:** Update `CLIENT_URL` to match your production frontend URL

### Issue: WordPress JWT plugin not working
**Solution:** Verify plugin is active, JWT secret is set, and endpoints are accessible

### Issue: SSL certificate validation errors
**Solution:** Ensure valid SSL certificates are installed and `SSL_VERIFY=true`

---

**Bottom Line:** All three components (React App, Express Server, WordPress) MUST use HTTPS in production for the secure cookie authentication to work properly and maintain security.