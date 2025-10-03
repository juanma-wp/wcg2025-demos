# WordPress REST API Authentication Demos - WordCamp Galicia 2025

This repository contains comprehensive demos for the talk **"Hablando con WordPress desde fuera: autenticación y acceso a datos"** at WordCamp Galicia 2025.

## 📁 Demo Projects

1. **wp-rest-auth-demo** - WordPress plugin demonstrating custom endpoints and authentication integration
2. **react-wp-oauth-demo** - React demo showcasing OAuth2 Authorization Code flow
3. **react-wp-jwt-demo** - React demo showcasing JWT authentication with production deployment

> **🔌 Required Plugins:** These demos work with professional authentication plugins (see setup section below).

## 🔧 Prerequisites

- **WordPress Installation** (local or remote server)
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Local Development Server** (MAMP, XAMPP, or similar for local WordPress)

## 📁 Project Structure

```
wcg2025-demos/
├── wp-rest-auth-demo/           # WordPress Plugin Demo
├── react-wp-oauth-demo/         # OAuth2 React Demo App
├── react-wp-jwt-demo/           # JWT React Demo App
└── README.md                    # This file
```

## 🔌 WordPress Plugins Required

These demos work with professional authentication plugins that provide secure, production-ready authentication methods:

### Authentication Plugins

1. **[JWT Auth Pro WP REST API](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)** - Modern JWT authentication with refresh tokens
2. **[OAuth2 Auth Pro WP REST API](https://github.com/juanma-wp/oauth2-auth-pro-wp-rest-api)** - Complete OAuth2 Authorization Code flow

### Plugin Features

#### JWT Auth Pro
- **Short-lived access tokens** (1 hour default) with secure refresh tokens
- **HTTP-only cookies** for XSS protection
- **Automatic token rotation** for enhanced security
- **Session management** with database tracking
- **CORS support** for React applications

#### OAuth2 Auth Pro
- **OAuth2 Authorization Code Flow** with PKCE security
- **Scope-based permissions** (read, write, delete, upload_files, etc.)
- **User consent screens** with WordPress-styled UI
- **Third-party app authorization** support
- **Comprehensive security** with proper token validation

### Alternative: Application Passwords

For simpler setups, you can also use **WordPress Application Passwords** (available since WordPress 5.6) without additional plugins.

### Quick Setup

1. Install the authentication plugins:
   - [JWT Auth Pro](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)
   - [OAuth2 Auth Pro](https://github.com/juanma-wp/oauth2-auth-pro-wp-rest-api)
2. Activate the one you need in WordPress admin (and deactivate the other one)
3. Configure JWT secret and OAuth2 clients before using them
4. Install the demo plugin and set up the React demos below

---

## 🔌 1. WordPress Plugin Demo: `wp-rest-auth-demo`

A WordPress plugin that demonstrates how to create custom REST API endpoints and extend existing ones, showcasing how authentication works transparently across different methods.

### Features

- **Custom Public Endpoints** - Accessible without authentication
- **Custom Protected Endpoints** - Require authentication (JWT, OAuth2, or Application Passwords)
- **Capability-based Endpoints** - Require specific user permissions
- **Extended Core Endpoints** - Add custom fields to existing WordPress endpoints
- **Multi-auth Support** - Works with JWT, OAuth2, and Application Passwords simultaneously

### What It Demonstrates

1. ✅ **How to create custom endpoints protected by authentication**
2. ✅ **How to modify/extend existing WordPress endpoints**
3. ✅ **How JWT/OAuth2/Application Password authentication applies automatically to all endpoints**

### Available Endpoints

#### Public Endpoints
- `GET /wp-json/wcg2025/v1/public/stats` - Site statistics (no auth required)

#### Protected Endpoints
- `GET /wp-json/wcg2025/v1/protected/user-data` - Current user information
- `GET /wp-json/wcg2025/v1/protected/my-drafts` - User's draft posts
- `PUT /wp-json/wcg2025/v1/protected/profile` - Update user profile

#### Capability-based Endpoints
- `POST /wp-json/wcg2025/v1/protected/editor-only` - Create featured content (editors only)

#### Extended Core Endpoints
- Enhanced `/wp-json/wp/v2/posts` with custom fields:
  - `reading_time` - Estimated reading time
  - `author_bio` - Author biography
  - `view_count` - Post view counter (editable with auth)

### Setup

1. Copy the `wp-rest-auth-demo` folder to your WordPress plugins directory
2. Activate the plugin in WordPress admin
3. The endpoints are automatically registered and ready to use

### Usage Examples

```bash
# Public endpoint - works without authentication
curl https://your-site.com/wp-json/wcg2025/v1/public/stats

# Protected endpoint with JWT
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-site.com/wp-json/wcg2025/v1/protected/user-data

# Protected endpoint with OAuth2
curl -H "Authorization: Bearer YOUR_OAUTH2_TOKEN" \
  https://your-site.com/wp-json/wcg2025/v1/protected/user-data

# Protected endpoint with Application Password
curl -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://your-site.com/wp-json/wcg2025/v1/protected/user-data
```

---

## 🚀 2. OAuth2 Demo: `react-wp-oauth-demo`

A complete React application demonstrating OAuth2 Authorization Code flow with WordPress, featuring interactive API testing and scope-based permissions.

### Features

- **OAuth2 Authorization Code Flow** with PKCE security
- **Interactive Permission Selection** - choose which scopes to request
- **Real-time API Testing** - test different WordPress REST API endpoints
- **Permission Enforcement Demo** - see how OAuth2 scopes are enforced
- **WordPress-styled Consent Screen** - user-friendly permission approval
- **Comprehensive Error Handling** - detailed OAuth2 error messages

### Setup

1. Navigate to the project directory:
   ```bash
   cd react-wp-oauth-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your WordPress site details:
   ```env
   VITE_WP_BASE_URL=http://your-wordpress-site.com
   VITE_OAUTH_CLIENT_ID=your-client-id
   VITE_DEBUG=true
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5175`

### Usage Flow

1. **Select Permissions** - Choose which OAuth2 scopes to request
2. **Connect to WordPress** - Redirects to WordPress for authentication
3. **Grant Permissions** - User approves or denies requested scopes
4. **Test API Endpoints** - Try different actions with granted permissions
5. **See Security in Action** - Actions without proper scopes are blocked

### Available Scopes

- `read` - View posts, pages, and profile information
- `write` - Create and edit posts and pages
- `delete` - Delete posts and pages
- `upload_files` - Upload and manage media files
- `moderate_comments` - Moderate and manage comments
- `manage_categories` - Create and manage categories and tags

---

## 🔐 3. JWT Demo: `react-wp-jwt-demo`

A React application demonstrating JWT authentication with WordPress, including production deployment capabilities.

### Features

- **JWT Authentication** with access and refresh tokens
- **Automatic Token Refresh** - seamless background token renewal
- **Production Ready** - includes deployment configurations
- **Silent Login** - maintains authentication across browser sessions
- **Secure Cookie Handling** - HTTP-only cookies for refresh tokens

### Setup

1. Navigate to the project directory:
   ```bash
   cd react-wp-jwt-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your settings:
   ```env
   VITE_API_BASE_URL=http://your-wordpress-site.com/wp-json
   VITE_APP_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5174`

### Production Deployment

The JWT demo includes production deployment configurations:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy** the `dist` folder to your web server

3. **Configure** environment variables for production

---

## 📋 Setup Order

1. **First**: Install the authentication plugins in WordPress:
   - [JWT Auth Pro WP REST API](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)
   - [OAuth2 Auth Pro WP REST API](https://github.com/juanma-wp/oauth2-auth-pro-wp-rest-api)
2. **Second**: Install and activate the `wp-rest-auth-demo` plugin
3. **Third**: Configure the authentication plugin settings (JWT secret, OAuth2 clients)
4. **Fourth**: Set up the React demo applications
5. **Fifth**: Configure the demo apps to point to your WordPress installation

## 🛠️ Development Tips

### WordPress Plugins
- Install authentication plugins:
  - [JWT Auth Pro](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)
  - [OAuth2 Auth Pro](https://github.com/juanma-wp/oauth2-auth-pro-wp-rest-api)
- Copy `wp-rest-auth-demo` to your plugins directory
- Enable WordPress debug logging: `define('WP_DEBUG_LOG', true);`
- Check logs at: `wp-content/debug.log`
- Use the plugin's debug mode for OAuth2 troubleshooting

### React App Development
- Set `VITE_DEBUG=true` for detailed OAuth2/JWT logging
- Use browser developer tools to inspect network requests
- Check local storage for token storage

### Common Issues

1. **CORS Errors**: Ensure WordPress has proper CORS headers configured in the authentication plugins
2. **Redirect URI Mismatch**: Verify OAuth2 client redirect URIs match exactly in OAuth2 Auth Pro settings
3. **Token Expiration**: Check JWT secret key configuration in JWT Auth Pro settings
4. **Scope Permissions**: Ensure user has proper WordPress capabilities for requested scopes
5. **Plugin Dependencies**: Make sure both authentication plugins are installed and activated
6. **Application Passwords**: For testing without plugins, ensure Application Passwords are enabled in WordPress

## 📚 Additional Resources

- [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/)
- [OAuth2 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT.io](https://jwt.io/) - JWT token inspector
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎤 WordCamp Galicia 2025

These demos were created for the talk **"Hablando con WordPress desde fuera: autenticación y acceso a datos"** at WordCamp Galicia 2025.

### Talk Overview

The presentation demonstrates three key concepts:

1. **Creating custom REST API endpoints** with proper authentication
2. **Extending existing WordPress endpoints** with custom fields
3. **How authentication works transparently** across JWT, OAuth2, and Application Passwords

### Demo Flow

1. **WordPress Plugin Demo** - Show custom endpoints and authentication integration
2. **React OAuth2 Demo** - Interactive OAuth2 flow with scope-based permissions
3. **React JWT Demo** - Modern JWT authentication with refresh tokens
4. **Live API Testing** - Real-time endpoint testing with different auth methods

### Key Takeaways

- Authentication is **transparent** - once configured, it works across all endpoints
- **Multiple auth methods** can coexist (JWT, OAuth2, Application Passwords)
- **Custom endpoints** integrate seamlessly with WordPress authentication
- **Security best practices** are built into the authentication plugins

## 📄 License

This project is licensed under the MIT License - see individual project directories for specific license files.

---

**¡Disfruta de la charla! 🚀**