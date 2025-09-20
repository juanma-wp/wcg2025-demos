# React WordPress JWT Demo

A demonstration React application that showcases JWT authentication integration with WordPress REST API. This project demonstrates how to build a modern React frontend that authenticates with WordPress using JWT tokens.

## 🚀 Features

- **🔐 Secure JWT Authentication**: Modern hybrid approach with access tokens in memory and refresh tokens in HttpOnly cookies
- **🔄 Automatic Token Refresh**: Silent re-authentication prevents session loss
- **🛡️ XSS Protection**: Access tokens stored in memory, not localStorage
- **🍪 HttpOnly Cookies**: Refresh tokens stored securely, inaccessible to JavaScript
- **⚛️ React Router**: Client-side routing with protected routes
- **💅 Modern UI**: Built with Tailwind CSS for responsive design
- **📝 TypeScript**: Full type safety throughout the application
- **🐛 Debug Tools**: Built-in JWT token validation and debugging
- **🔌 WordPress Integration**: Secure integration with WordPress REST API

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

### Required Software
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **WordPress site** with JWT authentication plugin

### WordPress Setup

1. **Install JWT Authentication Plugin**
   - Install the [JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) plugin
   - Or manually install a JWT authentication plugin that provides the `/wp-json/jwt-auth/v1/token` endpoint

2. **Configure WordPress**
   - Add the following to your WordPress `wp-config.php` file:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your-top-secret-key');
   define('JWT_AUTH_CORS_ENABLE', true);
   ```

3. **Enable CORS** (if needed)
   - Add CORS headers to allow requests from your React app domain
   - The plugin should handle this if `JWT_AUTH_CORS_ENABLE` is set to `true`

## 🛠️ Installation

### 1. React App Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd react-wp-jwt-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the project root:
   ```env
   VITE_WP_BASE_URL=https://your-wordpress-site.com
   ```
   Replace `https://your-wordpress-site.com` with your actual WordPress site URL.

### 2. Auth Server Setup

1. **Navigate to the server directory**
   ```bash
   cd server
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Configure server environment**
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:
   ```env
   ACCESS_TOKEN_SECRET=your-secure-random-secret-key
   REFRESH_TOKEN_SECRET=your-secure-random-refresh-secret
   WP_JWT_ENDPOINT=http://localhost:8080/wp-json/jwt-auth/v1/token
   CLIENT_URL=http://localhost:5173
   PORT=3001
   ```

## 🚀 Running the Project

You need to run both the auth server and the React app:

### 1. Start the Auth Server
```bash
cd server
npm run dev
```
This starts the auth server at `http://localhost:3001`

### 2. Start the React App (in a new terminal)
```bash
npm run dev
```
This starts the React app at `http://localhost:5173`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
react-wp-jwt-demo/
├── src/                    # React app source
│   ├── api/               # API layer
│   │   ├── auth.ts       # Auth server API calls
│   │   └── wp.ts         # WordPress REST API calls
│   ├── components/       # Reusable UI components
│   │   ├── LoginForm.tsx # Login form component
│   │   └── Navbar.tsx    # Navigation component
│   ├── context/         # React Context providers
│   │   └── AuthContext.tsx # Authentication state management
│   ├── lib/            # Utility libraries
│   │   ├── http.ts     # HTTP client configuration
│   │   └── useLocalStorage.ts # Local storage hook
│   ├── pages/          # Page components
│   │   ├── Home.tsx    # Home page
│   │   ├── Profile.tsx # User profile page
│   │   └── Publish.tsx # Content publishing page
│   ├── utils/          # Utility functions
│   │   └── jwt-debug.ts # JWT debugging utilities
│   ├── App.tsx         # Main app component
│   ├── main.tsx       # App entry point
│   └── routes.tsx     # Route definitions
├── server/            # Auth server
│   ├── server.js      # Express server with JWT handling
│   ├── package.json   # Server dependencies
│   ├── .env.example   # Environment template
│   └── README.md      # Server documentation
└── package.json       # React app dependencies
```

### Component Architecture

```mermaid
graph TD
    A[React App] --> B[AuthProvider - Memory Storage]
    B --> C[Navbar]
    B --> D[Routes]

    D --> E[Home Page]
    D --> F[Profile Page - Protected]
    D --> G[Publish Page - Protected]

    C --> H[LoginForm]
    H --> I[Auth Server API]
    I --> J[Express Auth Server]
    J --> K[WordPress JWT Endpoint]

    B --> L[Memory Access Token]
    J --> M[HttpOnly Cookie - Refresh Token]
    B --> N[Auto Refresh Logic]
    B --> O[JWT Debug Utils]

    F --> P[useAuth Hook]
    G --> P
    P --> B

    style F fill:#ffe6e6
    style G fill:#ffe6e6
    style P fill:#e6f3ff
    style B fill:#e6ffe6
    style J fill:#fff2e6
    style L fill:#e6ffe6
    style M fill:#ffe6f2
```
## 🔧 Technology Stack

### Frontend (React App)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Ky** - Modern HTTP client
- **PostCSS & Autoprefixer** - CSS processing

### Backend (Auth Server)
- **Node.js** - Runtime
- **Express.js** - Web framework
- **jsonwebtoken** - JWT creation and verification
- **cookie-parser** - Cookie handling middleware
- **cors** - Cross-origin resource sharing
- **ky** - HTTP client for WordPress API calls

## 🔐 Authentication Flow


```mermaid
sequenceDiagram
    participant User
    participant React App
    participant Memory
    participant Auth Server
    participant Cookie
    participant WordPress API

    User->>React App: Enter credentials
    React App->>Auth Server: POST /api/login
    Auth Server->>WordPress API: POST /wp-json/jwt-auth/v1/token
    WordPress API->>Auth Server: Return WP JWT + user data
    Auth Server->>Auth Server: Generate access token + refresh token
    Auth Server->>Cookie: Set HttpOnly refresh token
    Auth Server->>React App: Return access token + user data
    React App->>Memory: Store access token
    React App->>User: Show authenticated state

    Note over React App: For WordPress API requests
    React App->>Memory: Get access token
    React App->>Auth Server: Extract WP token from access token
    React App->>WordPress API: API call with WP token
    WordPress API->>React App: Return protected data

    Note over React App: Auto token refresh (before expiry)
    React App->>Auth Server: POST /api/refresh (with cookie)
    Auth Server->>Cookie: Read refresh token
    Auth Server->>Auth Server: Validate refresh token
    Auth Server->>React App: Return new access token
    React App->>Memory: Update access token
```

### Modern Secure Authentication Flow

1. **🔐 User Login**: User enters credentials in the login form
2. **🌐 Server Authentication**: React app sends credentials to auth server
3. **✅ WordPress Validation**: Auth server validates with WordPress JWT endpoint
4. **🎟️ Token Generation**: Auth server creates access token (15 min) and refresh token (7 days)
5. **🍪 Secure Storage**: Refresh token stored in HttpOnly cookie, access token returned to React
6. **💾 Memory Storage**: Access token stored in React app memory (not localStorage)
7. **🔄 Auto Refresh**: Before access token expires, automatically refresh using HttpOnly cookie
8. **🚪 Secure Logout**: Server clears refresh token cookie and invalidates session
9. **🔒 API Calls**: WordPress API calls use embedded WP token from access token payload

### 🛡️ Security Benefits

- **❌ XSS Protection**: Access tokens not in localStorage, refresh tokens not accessible to JavaScript
- **✅ Session Persistence**: HttpOnly cookies survive page refreshes
- **🔄 Automatic Recovery**: Silent token refresh maintains user session
- **🚫 CSRF Protection**: SameSite cookie attributes prevent cross-site attacks
- **⏰ Short-Lived Tokens**: Access tokens expire quickly, limiting exposure window

## 🐛 Debugging

The application includes comprehensive JWT debugging features:

- **Console Logging**: Detailed logs for authentication flow
- **Token Validation**: Automatic JWT token structure validation
- **Request Tracking**: HTTP request/response logging
- **Token Preview**: Safe token preview in console (first 20 characters)

Check the browser console for debugging information prefixed with `🔍 JWT Debug`.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WP_BASE_URL` | Your WordPress site URL | Yes |

### WordPress Plugin Configuration

Ensure your JWT plugin is configured with:
- Secret key for token signing
- CORS enabled for your domain
- Proper endpoint `/wp-json/jwt-auth/v1/token`

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is enabled in your WordPress JWT plugin
   - Check that your domain is allowed in CORS settings

2. **Authentication Fails**
   - Verify WordPress credentials are correct
   - Check that JWT plugin is active and configured
   - Ensure the JWT secret key is set in wp-config.php

3. **Token Invalid**
   - Check token expiration settings in WordPress
   - Verify the JWT secret key matches between WordPress and any validation

4. **API Endpoints Not Found**
   - Confirm JWT authentication plugin is installed and active
   - Check that permalink structure is not "Plain"

## 📚 API Endpoints Used

- `POST /wp-json/jwt-auth/v1/token` - Login and get JWT token
- `POST /wp-json/jwt-auth/v1/token/validate` - Validate existing token (if supported by plugin)

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to fork and modify for your own learning or projects.

## 📄 License

This project is for demonstration purposes. Check individual package licenses for dependencies.
